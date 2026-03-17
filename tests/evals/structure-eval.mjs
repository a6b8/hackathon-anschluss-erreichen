/**
 * Eval: Agent Response Structure
 *
 * Validates that agent responses have the expected structure.
 * Runs against saved fixtures in tests/fixtures/responses/
 *
 * Usage:
 *   node tests/evals/structure-eval.mjs
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const FIXTURES_DIR = join( __dirname, '..', 'fixtures', 'responses' )


const expectedFields = [ 'content' ]
const expectedContentFields = [ 'type', 'text' ]


const validateResponse = ( { name, data } ) => {
    const findings = []

    if( !data?.result ) {
        findings.push( { field: 'result', status: 'MISSING', detail: 'No result in response' } )

        return { name, findings, passed: false }
    }

    const result = data.result

    expectedFields.forEach( ( field ) => {
        if( !result[ field ] ) {
            findings.push( { field, status: 'MISSING' } )
        } else {
            findings.push( { field, status: 'PRESENT' } )
        }
    } )

    if( Array.isArray( result.content ) ) {
        result.content.forEach( ( item, idx ) => {
            expectedContentFields.forEach( ( field ) => {
                if( !item[ field ] ) {
                    findings.push( { field: `content[${idx}].${field}`, status: 'MISSING' } )
                }
            } )

            if( item.type === 'text' && item.text ) {
                try {
                    const parsed = JSON.parse( item.text )
                    const structureFields = [ 'title', 'analysis', 'keyFindings', 'sources' ]

                    structureFields.forEach( ( sf ) => {
                        if( parsed[ sf ] ) {
                            findings.push( { field: `structured.${sf}`, status: 'PRESENT' } )
                        } else {
                            findings.push( { field: `structured.${sf}`, status: 'MISSING', detail: 'Optional structured field' } )
                        }
                    } )
                } catch {
                    findings.push( { field: 'structured', status: 'NOT_JSON', detail: 'Text content is not JSON' } )
                }
            }
        } )
    }

    const hasCriticalMissing = findings.some( ( f ) => f.status === 'MISSING' && expectedFields.includes( f.field ) )

    return { name, findings, passed: !hasCriticalMissing }
}


const run = async () => {
    console.log( '\n=== Structure Eval ===\n' )

    let files = []
    try {
        files = ( await readdir( FIXTURES_DIR ) )
            .filter( ( f ) => f.endsWith( '.json' ) )
    } catch {
        console.log( 'No fixtures found. Run E2E tests with --capture first.' )
        console.log( `Expected: ${FIXTURES_DIR}/*.json` )
        process.exit( 0 )
    }

    if( files.length === 0 ) {
        console.log( 'No fixture files found. Run E2E tests with --capture first.' )
        process.exit( 0 )
    }

    const results = await Promise.all(
        files.map( async ( file ) => {
            const content = await readFile( join( FIXTURES_DIR, file ), 'utf-8' )
            const data = JSON.parse( content )

            return validateResponse( { name: file, data } )
        } )
    )

    results.forEach( ( r ) => {
        console.log( `${r.passed ? 'PASS' : 'FAIL'}: ${r.name}` )
        r.findings.forEach( ( f ) => {
            const icon = f.status === 'PRESENT' ? '+' : f.status === 'MISSING' ? '-' : '?'
            console.log( `  [${icon}] ${f.field}: ${f.status}${f.detail ? ` (${f.detail})` : ''}` )
        } )
        console.log()
    } )

    const passed = results.filter( ( r ) => r.passed ).length
    const failed = results.filter( ( r ) => !r.passed ).length
    console.log( `\nSummary: ${passed} passed, ${failed} failed out of ${results.length} fixtures` )

    process.exit( failed > 0 ? 1 : 0 )
}


run().catch( ( err ) => {
    console.error( `FATAL: ${err.message}` )
    process.exit( 1 )
} )
