/**
 * Infrastructure test — verifies schema/manifest loading and server setup
 * WITHOUT requiring ANTHROPIC_API_KEY (no AgentLoop needed)
 */

import { loadManifest } from '../lib/manifest-loader.mjs'
import { loadSchemas } from '../lib/schema-loader.mjs'


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


async function testManifestLoading() {
    console.log( '\n--- Test: Manifest Loading ---' )

    const agents = [
        { path: './agents/bahnhofs-ueberleben/agent.mjs', name: 'bahnhofs-ueberleben' },
        { path: './agents/ticketkauf/agent.mjs', name: 'ticketkauf' },
        { path: './agents/anschluss-navigator/agent.mjs', name: 'anschluss-navigator' },
        { path: './agents/stadt-navigator/agent.mjs', name: 'stadt-navigator' },
        { path: './agents/radparken/agent.mjs', name: 'radparken' },
        { path: './agents/anschluss-mobility/agent.mjs', name: 'anschluss-mobility' }
    ]

    const loadPromises = agents
        .map( async ( { path, name } ) => {
            try {
                const manifest = await loadManifest( { path } )
                assert( manifest.name === name, `${name} manifest loads correctly` )
                assert( manifest.systemPrompt && manifest.systemPrompt.length > 0, `${name} has systemPrompt` )
                assert( manifest.tools && Object.keys( manifest.tools ).length > 0, `${name} has tools defined` )
                assert( manifest.tests && manifest.tests.length >= 3, `${name} has >= 3 tests` )
                assert( manifest.inputSchema, `${name} has inputSchema` )
            } catch( error ) {
                assert( false, `${name} manifest loading failed: ${error.message}` )
            }
        } )

    await Promise.all( loadPromises )
}


async function testSchemaLoading() {
    console.log( '\n--- Test: Schema Loading ---' )

    const providerSets = [
        {
            name: 'bahnhof-schemas',
            providers: [ 'overpass-mobility', 'transport-rest-db', 'nominatim', 'bright-sky' ],
            expectedMin: 4
        },
        {
            name: 'ticket-schemas',
            providers: [ 'transport-rest-db', 'flixbus', 'nominatim', 'bright-sky' ],
            expectedMin: 4
        }
    ]

    const loadPromises = providerSets
        .map( async ( { name, providers, expectedMin } ) => {
            const schemas = await loadSchemas( { providers } )
            assert( schemas.length >= expectedMin, `${name}: loaded ${schemas.length} schemas (expected >= ${expectedMin})` )

            schemas
                .forEach( ( schema ) => {
                    const toolCount = schema.tools ? Object.keys( schema.tools ).length : 0
                    assert( toolCount > 0, `${schema.namespace}: has ${toolCount} tools` )
                    assert( schema.root && schema.root.startsWith( 'http' ), `${schema.namespace}: has valid root URL` )
                } )
        } )

    await Promise.all( loadPromises )
}


async function testMainAgentSubAgentConfig() {
    console.log( '\n--- Test: Main Agent Sub-Agent Configuration ---' )

    const mainManifest = await loadManifest( { path: './agents/anschluss-mobility/agent.mjs' } )

    assert( mainManifest.name === 'anschluss-mobility', 'Main agent name correct' )
    assert( mainManifest.systemPrompt.includes( 'Ticketkauf' ), 'Main systemPrompt mentions Ticketkauf module' )
    assert( mainManifest.systemPrompt.includes( 'Bahnhofs-Ueberleben' ) || mainManifest.systemPrompt.includes( 'gestrandet' ), 'Main systemPrompt mentions survival module' )

    const toolKeys = Object.keys( mainManifest.tools )
    assert( toolKeys.length > 0, `Main agent has ${toolKeys.length} tool references` )
}


async function run() {
    console.log( '=== Hackathon Infrastructure Tests ===' )

    await testManifestLoading()
    await testSchemaLoading()
    await testMainAgentSubAgentConfig()

    console.log( `\n=== Results: ${results.passed} passed, ${results.failed} failed ===' ` )

    if( results.failed > 0 ) {
        console.log( '\nFailed tests:' )
        results.errors
            .forEach( ( e ) => { console.log( `  - ${e}` ) } )

        process.exit( 1 )
    }
}


run()
    .catch( ( error ) => {
        console.error( 'Test runner failed:', error )
        process.exit( 1 )
    } )
