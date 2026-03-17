/**
 * E2E Test: Single Agent with real LLM
 *
 * Requires:
 *   - Server running on localhost:4100 (npm run start:dev)
 *   - API Key in .hackathon.env (LLM_BASE_URL, LLM_API_KEY)
 *
 * Usage:
 *   node tests/e2e/single-agent.test.mjs
 *   node tests/e2e/single-agent.test.mjs --capture   # Save responses to fixtures
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const CAPTURE = process.argv.includes( '--capture' )
const BASE_URL = process.env.E2E_URL || 'http://localhost:4100'


const jsonrpc = ( id, method, params = {} ) => ( {
    jsonrpc: '2.0',
    id,
    method,
    params
} )


const post = async ( { url, body, sessionId } ) => {
    const headers = { 'Content-Type': 'application/json' }

    if( sessionId ) {
        headers[ 'mcp-session-id' ] = sessionId
    }

    const start = Date.now()
    const response = await fetch( url, {
        method: 'POST',
        headers,
        body: JSON.stringify( body )
    } )
    const elapsed = Date.now() - start
    const data = await response.json()

    return { data, elapsed, status: response.status, headers: Object.fromEntries( response.headers ) }
}


const saveFixture = async ( name, data ) => {
    if( !CAPTURE ) {
        return
    }

    const fixturePath = join( __dirname, '..', 'fixtures', 'responses', `${name}.json` )
    await mkdir( dirname( fixturePath ), { recursive: true } )
    await writeFile( fixturePath, JSON.stringify( data, null, 2 ) )
    console.log( `  [CAPTURED] ${fixturePath}` )
}


const results = { passed: 0, failed: 0, skipped: 0, tests: [] }

const assert = ( name, condition, detail = '' ) => {
    if( condition ) {
        results.passed++
        results.tests.push( { name, status: 'PASS' } )
        console.log( `  PASS: ${name}` )
    } else {
        results.failed++
        results.tests.push( { name, status: 'FAIL', detail } )
        console.log( `  FAIL: ${name} — ${detail}` )
    }
}


const run = async () => {
    console.log( `\n=== E2E Test: Single Agent ===` )
    console.log( `URL: ${BASE_URL}` )
    console.log( `Capture: ${CAPTURE}\n` )

    // --- Test 1: Health endpoint ---
    console.log( '--- Health Check ---' )
    try {
        const healthRes = await fetch( `${BASE_URL}/health` )
        const health = await healthRes.json()

        assert( 'Health endpoint responds', healthRes.status === 200 )
        assert( 'Health status is ok', health.status === 'ok' )
        assert( 'Health lists agents', Array.isArray( health.agents ) && health.agents.length > 0 )
    } catch( err ) {
        console.error( `\nServer nicht erreichbar: ${err.message}` )
        console.error( `Starte den Server mit: npm run start:dev` )
        process.exit( 1 )
    }

    // --- Test 2: MCP Initialize on /mcp/bahnhof ---
    console.log( '\n--- MCP Initialize (Bahnhof Agent) ---' )
    const initResult = await post( {
        url: `${BASE_URL}/mcp/bahnhof`,
        body: jsonrpc( 1, 'initialize', {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'e2e-test', version: '1.0.0' }
        } )
    } )

    const sessionId = initResult.headers[ 'mcp-session-id' ] || null
    assert( 'Initialize returns result', !!initResult.data?.result, JSON.stringify( initResult.data ) )
    assert( 'Session ID received', !!sessionId )
    console.log( `  Session: ${sessionId}` )
    console.log( `  Timing: ${initResult.elapsed}ms` )

    // --- Test 3: tools/list ---
    console.log( '\n--- tools/list ---' )
    const listResult = await post( {
        url: `${BASE_URL}/mcp/bahnhof`,
        body: jsonrpc( 2, 'tools/list', {} ),
        sessionId
    } )

    const tools = listResult.data?.result?.tools || []
    assert( 'tools/list returns tools', tools.length > 0, `Got ${tools.length} tools` )
    console.log( `  Tools: ${tools.length}` )
    tools.forEach( ( t ) => console.log( `    - ${t.name}` ) )
    console.log( `  Timing: ${listResult.elapsed}ms` )

    await saveFixture( 'tools-list-bahnhof', listResult.data )

    // --- Test 4: tools/call (real LLM) ---
    console.log( '\n--- tools/call (Real LLM — may take 30-60s) ---' )
    const callStart = Date.now()
    const callResult = await post( {
        url: `${BASE_URL}/mcp/bahnhof`,
        body: jsonrpc( 3, 'tools/call', {
            name: tools[ 0 ]?.name || 'bahnhofs-ueberleben',
            arguments: { query: 'Was gibt es am Berlin Hauptbahnhof?' }
        } ),
        sessionId
    } )
    const callElapsed = Date.now() - callStart

    const content = callResult.data?.result?.content || []
    const hasText = content.some( ( c ) => c.type === 'text' && c.text.length > 10 )

    assert( 'tools/call returns content', content.length > 0, JSON.stringify( callResult.data?.error || {} ) )
    assert( 'Content has meaningful text', hasText )
    assert( 'Response under 120s', callElapsed < 120000, `Took ${callElapsed}ms` )

    console.log( `  Timing: ${callElapsed}ms` )
    if( hasText ) {
        const text = content[ 0 ].text
        console.log( `  Result preview: ${text.slice( 0, 200 )}...` )
    }

    await saveFixture( 'tools-call-bahnhof-berlin', callResult.data )

    // --- Summary ---
    console.log( `\n=== Summary ===` )
    console.log( `Passed: ${results.passed}` )
    console.log( `Failed: ${results.failed}` )
    console.log( `Skipped: ${results.skipped}` )

    if( results.failed > 0 ) {
        console.log( '\nFailed tests:' )
        results.tests
            .filter( ( t ) => t.status === 'FAIL' )
            .forEach( ( t ) => console.log( `  - ${t.name}: ${t.detail}` ) )
    }

    process.exit( results.failed > 0 ? 1 : 0 )
}


run()
    .catch( ( err ) => {
        console.error( `\nFATAL: ${err.message}` )
        process.exit( 1 )
    } )
