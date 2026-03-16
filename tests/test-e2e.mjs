/**
 * End-to-End Test — requires ANTHROPIC_API_KEY
 *
 * Tests the full flow:
 * 1. Start server with all agents
 * 2. Send MCP initialize to /mcp/main
 * 3. Send tools/call ask with a query
 * 4. Verify response contains real data
 *
 * Usage: ANTHROPIC_API_KEY=sk-... node tests/test-e2e.mjs
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'


const PORT = process.env.PORT || 4100
const BASE_URL = `http://localhost:${PORT}`


const results = { passed: 0, failed: 0, errors: [] }

function assert( condition, message ) {
    if( condition ) {
        results.passed++
        console.log( `  PASS: ${message}` )
    } else {
        results.failed++
        results.errors.push( message )
        console.log( `  FAIL: ${message}` )
    }
}


async function testHealthEndpoint() {
    console.log( '\n--- Test: Health Endpoint ---' )

    try {
        const response = await fetch( `${BASE_URL}/health` )
        const data = await response.json()

        assert( response.status === 200, 'Health returns 200' )
        assert( data.status === 'ok', 'Health status is ok' )
        assert( data.agents.main === '/mcp/main', 'Main agent route listed' )
        assert( data.agents.bahnhof === '/mcp/bahnhof', 'Bahnhof agent route listed' )
    } catch( error ) {
        assert( false, `Health endpoint failed: ${error.message}` )
    }
}


async function testMcpInitialize( { route, name } ) {
    console.log( `\n--- Test: MCP Initialize ${name} (${route}) ---` )

    try {
        const transport = new StreamableHTTPClientTransport(
            new URL( `${BASE_URL}${route}` )
        )

        const client = new Client(
            { name: `test-client-${name}`, version: '1.0.0' },
            { capabilities: {} }
        )

        await client.connect( transport )
        assert( true, `${name}: MCP initialize successful` )

        const { tools } = await client.listTools()
        assert( tools.length > 0, `${name}: has ${tools.length} tool(s)` )

        tools
            .forEach( ( tool ) => {
                console.log( `    Tool: ${tool.name} — ${tool.description?.substring( 0, 60 )}...` )
            } )

        client.close()

        return { tools }
    } catch( error ) {
        assert( false, `${name}: MCP initialize failed: ${error.message}` )

        return { tools: [] }
    }
}


async function testSubAgentToolCall( { route, name, toolName, args } ) {
    console.log( `\n--- Test: Tool Call ${name} → ${toolName} ---` )

    try {
        const transport = new StreamableHTTPClientTransport(
            new URL( `${BASE_URL}${route}` )
        )

        const client = new Client(
            { name: `test-client-${name}`, version: '1.0.0' },
            { capabilities: {} }
        )

        await client.connect( transport )

        console.log( `  Calling ${toolName} with:`, JSON.stringify( args ) )
        const startTime = Date.now()

        const result = await client.callTool( { name: toolName, arguments: args } )

        const duration = Date.now() - startTime
        console.log( `  Duration: ${duration}ms` )

        assert( !result.isError, `${name}: tool call succeeded (no error)` )
        assert( result.content && result.content.length > 0, `${name}: response has content` )

        if( result.content && result.content[ 0 ] ) {
            const text = result.content[ 0 ].text || ''
            console.log( `  Response preview: ${text.substring( 0, 200 )}...` )
            assert( text.length > 0, `${name}: response text is not empty` )
        }

        client.close()

        return result
    } catch( error ) {
        assert( false, `${name}: tool call failed: ${error.message}` )

        return null
    }
}


async function run() {
    console.log( '=== Hackathon E2E Tests ===' )
    console.log( `Server: ${BASE_URL}` )
    console.log( 'NOTE: Server must be running (npm start) before running these tests\n' )

    // Test 1: Health
    await testHealthEndpoint()

    // Test 2: MCP Initialize on all routes
    await testMcpInitialize( { route: '/mcp/bahnhof', name: 'bahnhof' } )
    await testMcpInitialize( { route: '/mcp/tickets', name: 'tickets' } )
    await testMcpInitialize( { route: '/mcp/main', name: 'main' } )

    // Test 3: Sub-Agent direct tool call (bahnhof)
    await testSubAgentToolCall( {
        route: '/mcp/bahnhof',
        name: 'bahnhof',
        toolName: 'ask',
        args: { query: 'Ich bin am Leipzig Hbf gestrandet, 23 Uhr. Wo ist die Toilette?' }
    } )

    // Test 4: Main Agent delegation
    await testSubAgentToolCall( {
        route: '/mcp/main',
        name: 'main',
        toolName: 'ask',
        args: { query: 'Was kostet ein Zug von Berlin nach Freiburg?' }
    } )

    console.log( `\n=== Results: ${results.passed} passed, ${results.failed} failed ===` )

    if( results.failed > 0 ) {
        console.log( '\nFailed tests:' )
        results.errors
            .forEach( ( e ) => { console.log( `  - ${e}` ) } )
    }

    process.exit( results.failed > 0 ? 1 : 0 )
}


run()
    .catch( ( error ) => {
        console.error( 'Test runner failed:', error )
        process.exit( 1 )
    } )
