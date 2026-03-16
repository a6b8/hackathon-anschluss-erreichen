import express from 'express'
import { AgentToolsServer } from 'mcp-agent-server'

import { EnvironmentManager } from './lib/EnvironmentManager.mjs'
import { loadSchemas } from './lib/schema-loader.mjs'
import { loadManifest } from './lib/manifest-loader.mjs'


const env = EnvironmentManager.load( {
    required: [ 'LLM_BASE_URL', 'LLM_API_KEY', 'PORT' ],
    optional: [ 'NODE_ENV', 'CORS_ORIGIN' ],
    envFile: '../../hackathon.env'
} )

const PORT = env[ 'PORT' ]
const LLM = {
    baseURL: env[ 'LLM_BASE_URL' ],
    apiKey: env[ 'LLM_API_KEY' ]
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
    app.use( bahnhofMcp.sseMiddleware() )
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
    app.use( mainMcp.sseMiddleware() )
    console.log( '  /mcp/main — Anschluss-Mobility Main Agent (ready)' )


    // --- Health endpoint ---
    app.get( '/health', ( req, res ) => {
        res.json( {
            status: 'ok',
            agents: [
                'anschluss-mobility',
                'bahnhofs-ueberleben',
                'ticketkauf'
            ],
            uptime: Math.floor( process.uptime() )
        } )
    } )


    app.listen( PORT, () => {
        console.log( `\nHackathon Anschluss-Mobility Server running on http://localhost:${PORT}` )
        console.log( `  Main Agent:  POST http://localhost:${PORT}/mcp/main` )
        console.log( `  Events SSE:  GET  http://localhost:${PORT}/events` )
        console.log( `  Health:      GET  http://localhost:${PORT}/health` )
    } )
}


startServer()
    .catch( ( error ) => {
        console.error( 'Failed to start server:', error )
        process.exit( 1 )
    } )
