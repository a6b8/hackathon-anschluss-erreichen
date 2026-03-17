/**
 * Elicitation Test Runner
 *
 * Tests whether the agent asks follow-up questions for vague queries
 * vs takes direct action for clear queries.
 *
 * Usage:
 *   node tests/evals/elicitation-test.mjs
 *   node tests/evals/elicitation-test.mjs --output logs/elicitation-001
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

const OUTPUT_DIR = getArg( 'output' ) || join( __dirname, '..', '..', 'logs', `elicitation-${new Date().toISOString().replace( /[:.]/g, '-' )}` )


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


const detectElicitation = ( { answerText } ) => {
    const lower = answerText.toLowerCase()
    const questionMarks = ( answerText.match( /\?/g ) || [] ).length
    const questionWords = [ 'wo ', 'welch', 'wann', 'wohin', 'was ', 'wie ', 'kannst du', 'koenntest du', 'moechtest du' ]
    const questionWordCount = questionWords
        .filter( ( w ) => lower.includes( w ) )
        .length

    const hasQuestion = questionMarks >= 1 && questionWordCount >= 1
    const isMainlyQuestion = questionMarks >= 2 || ( answerText.length < 500 && questionMarks >= 1 )

    return { hasQuestion, isMainlyQuestion, questionMarks, questionWordCount }
}


const run = async () => {
    console.log( `\n=== Elicitation Test ===` )
    console.log( `Server: ${BASE_URL}` )
    console.log( `Output: ${OUTPUT_DIR}\n` )

    const scenariosRaw = await readFile( join( __dirname, 'elicitation-scenarios.json' ), 'utf-8' )
    const { scenarios } = JSON.parse( scenariosRaw )

    await mkdir( OUTPUT_DIR, { recursive: true } )

    let correct = 0
    let total = 0
    const results = []

    for( const scenario of scenarios ) {
        process.stdout.write( `  ${scenario.id}... ` )
        total++

        const agentPath = '/mcp/main'
        const toolName = 'anschluss-mobility'
        const url = `${BASE_URL}${agentPath}`

        try {
            const init = await post( {
                url,
                body: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'elicitation-test', version: '1.0.0' } } }
            } )

            const call = await post( {
                url,
                body: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: toolName, arguments: { query: scenario.query } } },
                sessionId: init.sessionId
            } )

            const content = call.data?.result?.content || []
            const textContent = content
                .filter( ( c ) => c.type === 'text' )
                .map( ( c ) => c.text )
                .join( '\n' )

            let answerText = textContent
            try {
                const parsed = JSON.parse( textContent )
                answerText = parsed?.result?.text || parsed?.result?.analysis || textContent
            } catch {}

            const isCreditError = textContent.includes( '"code":402' ) || textContent.includes( 'credits' )
            if( isCreditError ) {
                console.log( 'CREDIT ERROR' )
                results.push( { id: scenario.id, error: 'credit_exhaustion' } )

                continue
            }

            const elicitation = detectElicitation( { answerText } )
            const expectedElicitation = scenario.expectElicitation
            const gotElicitation = elicitation.hasQuestion

            const match = expectedElicitation === gotElicitation
            if( match ) { correct++ }

            const verdict = match ? 'CORRECT' : 'WRONG'
            const expected = expectedElicitation ? 'question' : 'action'
            const got = gotElicitation ? 'question' : 'action'

            console.log( `${verdict} (expected: ${expected}, got: ${got}, ?:${elicitation.questionMarks})` )

            const result = {
                id: scenario.id,
                query: scenario.query,
                expectedElicitation,
                gotElicitation,
                match,
                elicitation,
                answerPreview: answerText.slice( 0, 500 ),
                totalTime: call.elapsed
            }

            results.push( result )

            await writeFile(
                join( OUTPUT_DIR, `${scenario.id}.json` ),
                JSON.stringify( result, null, 2 ),
                'utf-8'
            )
        } catch( error ) {
            console.log( `ERROR: ${error.message}` )
            results.push( { id: scenario.id, error: error.message } )
        }
    }

    const accuracy = total > 0 ? Math.round( ( correct / total ) * 100 ) : 0

    console.log( `\n=== Summary ===` )
    console.log( `Accuracy: ${correct}/${total} (${accuracy}%)` )
    console.log( `Expected questions: ${scenarios.filter( ( s ) => s.expectElicitation ).length}` )
    console.log( `Expected actions: ${scenarios.filter( ( s ) => !s.expectElicitation ).length}` )

    await writeFile(
        join( OUTPUT_DIR, 'results.json' ),
        JSON.stringify( { accuracy, correct, total, results }, null, 2 ),
        'utf-8'
    )

    console.log( `Results: ${OUTPUT_DIR}/results.json` )

    process.exit( accuracy < 50 ? 1 : 0 )
}


run().catch( ( err ) => {
    console.error( `FATAL: ${err.message}` )
    process.exit( 1 )
} )
