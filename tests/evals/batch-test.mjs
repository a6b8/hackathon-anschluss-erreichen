/**
 * Batch Test Runner
 *
 * Runs all scenarios from scenarios.json against the MCP server.
 * Collects responses + debug logs for analysis.
 *
 * Usage:
 *   node tests/evals/batch-test.mjs
 *   node tests/evals/batch-test.mjs --runs 3          # 3x per scenario
 *   node tests/evals/batch-test.mjs --ids stranded-bad-belzig,bike-parking-potsdam
 *   node tests/evals/batch-test.mjs --output logs/batch-01
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const BASE_URL = process.env.MCP_URL || 'http://localhost:4100'

const args = process.argv.slice( 2 )
const getArg = ( name ) => {
    const idx = args.indexOf( `--${name}` )
    return idx !== -1 && args[ idx + 1 ] ? args[ idx + 1 ] : null
}

const RUNS = parseInt( getArg( 'runs' ) || '1' )
const FILTER_IDS = getArg( 'ids' ) ? getArg( 'ids' ).split( ',' ) : null
const OUTPUT_DIR = getArg( 'output' ) || join( __dirname, '..', '..', 'logs', `batch-${new Date().toISOString().replace( /[:.]/g, '-' )}` )


const post = async ( { url, body, sessionId } ) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' }

    if( sessionId ) {
        headers[ 'mcp-session-id' ] = sessionId
    }

    const start = Date.now()
    const response = await fetch( url, { method: 'POST', headers, body: JSON.stringify( body ) } )
    const elapsed = Date.now() - start
    const raw = await response.text()
    const ct = response.headers.get( 'content-type' ) || ''

    let data
    if( ct.includes( 'text/event-stream' ) ) {
        const dataLines = raw.split( '\n' )
            .filter( ( line ) => line.startsWith( 'data: ' ) )
            .map( ( line ) => line.slice( 6 ) )

        data = dataLines.length > 0 ? JSON.parse( dataLines[ dataLines.length - 1 ] ) : {}
    } else {
        data = JSON.parse( raw )
    }

    return { data, elapsed, sessionId: response.headers.get( 'mcp-session-id' ) }
}


const runScenario = async ( { scenario, runIndex } ) => {
    const agentPath = scenario.via === 'main' ? '/mcp/main' : '/mcp/bahnhof'
    const toolName = scenario.via === 'main' ? 'anschluss-mobility' : 'bahnhofs-ueberleben'
    const url = `${BASE_URL}${agentPath}`

    const startTime = Date.now()

    try {
        const init = await post( {
            url,
            body: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'batch-test', version: '1.0.0' } } }
        } )

        const sessionId = init.sessionId

        const call = await post( {
            url,
            body: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: toolName, arguments: { query: scenario.query } } },
            sessionId
        } )

        const totalTime = Date.now() - startTime
        const content = call.data?.result?.content || []
        const textContent = content
            .filter( ( c ) => c.type === 'text' )
            .map( ( c ) => c.text )
            .join( '\n' )

        let parsedResult = null
        try {
            parsedResult = JSON.parse( textContent )
        } catch {
            parsedResult = { rawText: textContent }
        }

        const answerText = parsedResult?.result?.text || parsedResult?.result?.analysis || textContent

        const isCreditError = textContent.includes( '"code":402' ) || textContent.includes( 'requires more credits' )

        if( isCreditError ) {
            return {
                scenarioId: scenario.id,
                runIndex,
                success: false,
                totalTime,
                error: 'credit_exhaustion'
            }
        }

        const mustNotContainViolations = scenario.mustNotContain
            .filter( ( term ) => answerText.includes( term ) )

        return {
            scenarioId: scenario.id,
            runIndex,
            success: true,
            totalTime,
            initTime: init.elapsed,
            callTime: call.elapsed,
            toolName,
            answerText: answerText.slice( 0, 2000 ),
            answerLength: answerText.length,
            metadata: parsedResult?.metadata || parsedResult?.costs || {},
            mustNotContainViolations,
            groundTruthCheck: checkGroundTruth( { answerText, groundTruth: scenario.groundTruth } ),
            error: null
        }
    } catch( error ) {
        return {
            scenarioId: scenario.id,
            runIndex,
            success: false,
            totalTime: Date.now() - startTime,
            error: error.message
        }
    }
}


const normalizeUmlauts = ( text ) => {
    return text
        .replace( /ae/g, 'a' ).replace( /oe/g, 'o' ).replace( /ue/g, 'u' )
        .replace( /ä/g, 'a' ).replace( /ö/g, 'o' ).replace( /ü/g, 'u' )
        .replace( /ß/g, 'ss' )
}


const checkGroundTruth = ( { answerText, groundTruth } ) => {
    if( !groundTruth ) {
        return { checked: false }
    }

    const checks = {}
    const lower = answerText.toLowerCase()
    const normalized = normalizeUmlauts( lower )

    if( groundTruth.station ) {
        const stationLower = groundTruth.station.toLowerCase()
        const stationNorm = normalizeUmlauts( stationLower )
        checks.stationMentioned = lower.includes( stationLower ) || normalized.includes( stationNorm )
    }

    if( groundTruth.lat && groundTruth.lon ) {
        const latStr = groundTruth.lat.toString().slice( 0, 5 )
        checks.coordinatesUsed = lower.includes( latStr )
    }

    if( groundTruth.from ) {
        checks.fromMentioned = lower.includes( groundTruth.from.toLowerCase() )
    }

    if( groundTruth.to ) {
        checks.toMentioned = lower.includes( groundTruth.to.toLowerCase() )
    }

    return { checked: true, ...checks }
}


const run = async () => {
    console.log( `\n=== Batch Test ===` )
    console.log( `Server: ${BASE_URL}` )
    console.log( `Runs per scenario: ${RUNS}` )
    console.log( `Output: ${OUTPUT_DIR}\n` )

    const scenariosRaw = await readFile( join( __dirname, 'scenarios.json' ), 'utf-8' )
    const { scenarios } = JSON.parse( scenariosRaw )

    const filtered = FILTER_IDS
        ? scenarios.filter( ( s ) => FILTER_IDS.includes( s.id ) )
        : scenarios

    console.log( `Scenarios: ${filtered.length} (${filtered.length * RUNS} total runs)\n` )

    await mkdir( OUTPUT_DIR, { recursive: true } )

    const allResults = []

    for( const scenario of filtered ) {
        for( let runIdx = 0; runIdx < RUNS; runIdx++ ) {
            const label = RUNS > 1 ? `[${runIdx + 1}/${RUNS}]` : ''
            process.stdout.write( `  ${scenario.id} ${label}... ` )

            const result = await runScenario( { scenario, runIndex: runIdx } )
            allResults.push( result )

            if( result.success ) {
                const violations = result.mustNotContainViolations?.length || 0
                const gt = result.groundTruthCheck?.stationMentioned ? 'GT:OK' : 'GT:?'
                console.log( `${result.totalTime}ms | ${gt} | violations:${violations}` )
            } else {
                console.log( `FAILED: ${result.error}` )
            }

            await writeFile(
                join( OUTPUT_DIR, `${scenario.id}-run${runIdx}.json` ),
                JSON.stringify( result, null, 2 ),
                'utf-8'
            )
        }
    }

    await writeFile(
        join( OUTPUT_DIR, 'all-results.json' ),
        JSON.stringify( allResults, null, 2 ),
        'utf-8'
    )

    console.log( `\n=== Done: ${allResults.length} runs ===` )
    console.log( `Results: ${OUTPUT_DIR}/all-results.json` )

    const successCount = allResults.filter( ( r ) => r.success ).length
    const failCount = allResults.filter( ( r ) => !r.success ).length
    console.log( `Success: ${successCount} | Failed: ${failCount}` )

    process.exit( failCount > 0 ? 1 : 0 )
}


run().catch( ( err ) => {
    console.error( `FATAL: ${err.message}` )
    process.exit( 1 )
} )
