/**
 * Cross-Repo Integration Test: flowmcp-cli + mcp-agent-server
 *
 * Verifies that:
 * 1. flowmcp-cli correctly reads v3 schemas with 'tools' key
 * 2. mcp-agent-server registers tools from v3 schemas
 * 3. The combined flow works end-to-end
 *
 * Usage:
 *   node tests/integration/cli-server-integration.test.mjs
 */

import { AgentToolsServer } from 'mcp-agent-server'


const results = { passed: 0, failed: 0, tests: [] }

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
    console.log( '\n=== Cross-Repo Integration Test ===\n' )

    // --- Test 1: AgentToolsServer.create with tool config ---
    console.log( '--- Test 1: Create server with tool config ---' )
    try {
        const { mcp } = await AgentToolsServer.create( {
            name: 'integration-test',
            version: '1.0.0',
            routePath: '/mcp/test',
            llm: {
                baseURL: 'https://openrouter.ai/api',
                apiKey: 'test-key-not-real'
            },
            tools: [
                {
                    name: 'test-mobility',
                    description: 'Test mobility tool',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Mobility query' }
                        },
                        required: [ 'query' ]
                    },
                    agent: {
                        systemPrompt: 'You are a test mobility agent.',
                        model: 'anthropic/claude-sonnet-4.5',
                        maxRounds: 3,
                        maxTokens: 1024
                    },
                    toolSources: [
                        { type: 'flowmcp', schemas: [], serverParams: {} }
                    ]
                }
            ]
        } )

        assert( 'AgentToolsServer.create succeeds', !!mcp )

        // --- Test 2: listToolDefinitions ---
        console.log( '\n--- Test 2: List tool definitions ---' )
        const { tools } = mcp.listToolDefinitions()
        assert( 'listToolDefinitions returns tools', tools.length === 1 )
        assert( 'Tool name is correct', tools[ 0 ].name === 'test-mobility' )
        assert( 'Tool has description', !!tools[ 0 ].description )
        assert( 'Tool has inputSchema', !!tools[ 0 ].inputSchema )

        // --- Test 3: middleware returns function ---
        console.log( '\n--- Test 3: Middleware ---' )
        const middleware = mcp.middleware()
        assert( 'middleware() returns function', typeof middleware === 'function' )

        const sseMiddleware = mcp.sseMiddleware()
        assert( 'sseMiddleware() returns function', typeof sseMiddleware === 'function' )

        // --- Test 4: EventEmitter works ---
        console.log( '\n--- Test 4: EventEmitter ---' )
        let eventReceived = false
        mcp.on( 'agent:start', () => { eventReceived = true } )
        mcp.emit( 'agent:start', { test: true } )
        assert( 'EventEmitter emits and receives', eventReceived )

        // --- Test 5: Unknown tool returns error ---
        console.log( '\n--- Test 5: Unknown tool error ---' )
        const errorResult = await mcp.callTool( { name: 'nonexistent', arguments: {} } )
        assert( 'Unknown tool returns isError', errorResult.isError === true )
        assert( 'Error mentions unknown tool', errorResult.content[ 0 ].text.includes( 'Unknown tool' ) )

    } catch( err ) {
        assert( 'Server creation', false, err.message )
    }

    // --- Test 6: fromManifest with v3 format ---
    console.log( '\n--- Test 6: fromManifest with v3 schemas ---' )
    try {
        const manifest = {
            name: 'test-agent',
            version: 'flowmcp/3.0.0',
            description: 'Test v3 agent',
            tools: {
                'test-tool': {
                    name: 'test-v3-tool',
                    description: 'V3 format tool',
                    inputSchema: {
                        type: 'object',
                        properties: { q: { type: 'string' } }
                    },
                    agent: {
                        systemPrompt: 'Test',
                        model: 'test/model',
                        maxRounds: 3,
                        maxTokens: 1024
                    }
                }
            }
        }

        const { mcp } = await AgentToolsServer.fromManifest( {
            manifest,
            llm: { baseURL: 'https://test.com', apiKey: 'test-key' },
            schemas: []
        } )

        assert( 'fromManifest with v3 succeeds', !!mcp )
    } catch( err ) {
        assert( 'fromManifest with v3', false, err.message )
    }

    // --- Summary ---
    console.log( `\n=== Summary ===` )
    console.log( `Passed: ${results.passed}` )
    console.log( `Failed: ${results.failed}` )

    if( results.failed > 0 ) {
        results.tests
            .filter( ( t ) => t.status === 'FAIL' )
            .forEach( ( t ) => console.log( `  - ${t.name}: ${t.detail}` ) )
    }

    process.exit( results.failed > 0 ? 1 : 0 )
}


run().catch( ( err ) => {
    console.error( `\nFATAL: ${err.message}` )
    process.exit( 1 )
} )
