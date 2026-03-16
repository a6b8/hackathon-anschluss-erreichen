import express from 'express'
import { AgentToolsServer } from 'mcp-agent-server'

import { loadSchemas } from './lib/schema-loader.mjs'
import { loadManifest } from './lib/manifest-loader.mjs'


const PORT = process.env.PORT || 4100
const LLM = {
    baseURL: process.env.LLM_BASE_URL || 'https://api.anthropic.com',
    apiKey: process.env.ANTHROPIC_API_KEY
}

if( !LLM.apiKey ) {
    console.error( 'ANTHROPIC_API_KEY environment variable is required' )
    process.exit( 1 )
}


const app = express()
app.use( express.json() )


async function startServer() {
    console.log( 'Loading agent manifests and schemas...' )

    // --- Sub-Agent: Bahnhofs-Ueberleben ---
    const bahnhofManifest = await loadManifest( { path: './agents/bahnhofs-ueberleben/agent.mjs' } )
    const bahnhofSchemas = await loadSchemas( {
        providers: [
            'overpass-mobility',
            'transport-rest-db',
            'nominatim',
            'bright-sky'
        ]
    } )

    const { mcp: bahnhofMcp } = await AgentToolsServer.fromManifest( {
        manifest: bahnhofManifest,
        llm: LLM,
        schemas: bahnhofSchemas,
        elicitation: true,
        routePath: '/mcp/bahnhof'
    } )
    app.use( bahnhofMcp.middleware() )
    console.log( '  /mcp/bahnhof — Bahnhofs-Ueberleben (ready)' )


    // --- Sub-Agent: Ticketkauf ---
    const ticketManifest = await loadManifest( { path: './agents/ticketkauf/agent.mjs' } )
    const ticketSchemas = await loadSchemas( {
        providers: [
            'transport-rest-db',
            'flixbus',
            'nominatim',
            'bright-sky'
        ]
    } )

    const { mcp: ticketMcp } = await AgentToolsServer.fromManifest( {
        manifest: ticketManifest,
        llm: LLM,
        schemas: ticketSchemas,
        elicitation: true,
        routePath: '/mcp/tickets'
    } )
    app.use( ticketMcp.middleware() )
    console.log( '  /mcp/tickets — Ticketkauf (ready)' )


    // --- Main Agent ---
    const mainManifest = await loadManifest( { path: './agents/anschluss-mobility/agent.mjs' } )

    const { mcp: mainMcp } = await AgentToolsServer.fromManifest( {
        manifest: mainManifest,
        llm: LLM,
        schemas: [],
        subAgents: {
            'bahnhofs-ueberleben': { url: `http://localhost:${PORT}/mcp/bahnhof` },
            'ticketkauf': { url: `http://localhost:${PORT}/mcp/tickets` }
        },
        elicitation: false,
        routePath: '/mcp/main'
    } )
    app.use( mainMcp.middleware() )
    console.log( '  /mcp/main — Anschluss-Mobility Main Agent (ready)' )


    // --- Health endpoint ---
    app.get( '/health', ( req, res ) => {
        res.json( {
            status: 'ok',
            agents: {
                main: '/mcp/main',
                bahnhof: '/mcp/bahnhof',
                tickets: '/mcp/tickets'
            }
        } )
    } )


    app.listen( PORT, () => {
        console.log( `\nHackathon Anschluss-Mobility Server running on http://localhost:${PORT}` )
        console.log( `  Main Agent:  POST http://localhost:${PORT}/mcp/main` )
        console.log( `  Health:      GET  http://localhost:${PORT}/health` )
    } )
}


startServer()
    .catch( ( error ) => {
        console.error( 'Failed to start server:', error )
        process.exit( 1 )
    } )
