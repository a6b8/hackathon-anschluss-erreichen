import express from 'express'
import cookieParser from 'cookie-parser'
import { AgentToolsServer } from 'mcp-agent-server'

import { EnvironmentManager } from './lib/EnvironmentManager.mjs'
import { loadSchemas } from './lib/schema-loader.mjs'
import { loadManifest } from './lib/manifest-loader.mjs'


const env = EnvironmentManager.load( {
    required: [ 'LLM_BASE_URL', 'LLM_API_KEY', 'LOGIN_USER', 'LOGIN_PASS' ],
    optional: [ 'NODE_ENV', 'CORS_ORIGIN', 'PORT' ],
    envFile: '../../.hackathon.env'
} )

const PORT = process.env.PORT
const LLM = {
    baseURL: env[ 'LLM_BASE_URL' ],
    apiKey: env[ 'LLM_API_KEY' ]
}


const app = express()
app.use( express.json() )
app.use( cookieParser() )

// --- Fake Login ---
const SESSION_COOKIE = 'hackathon-session'

app.post( '/api/login', ( req, res ) => {
    const { username, password } = req.body

    if( username === env[ 'LOGIN_USER' ] && password === env[ 'LOGIN_PASS' ] ) {
        res.cookie( SESSION_COOKIE, 'authenticated', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } )
        res.json( { status: 'ok' } )
    } else {
        res.status( 401 ).json( { error: 'Invalid credentials' } )
    }
} )

app.use( express.static( 'public' ) )

// --- Auth Middleware (schuetzt /mcp/* gegen externe Requests ohne Login) ---
const requireAuth = ( req, res, next ) => {
    const ip = req.ip || req.connection?.remoteAddress || ''
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
    const hasOriginHeader = !!req.headers[ 'origin' ]
    const isInternalCall = isLocalhost && !hasOriginHeader

    if ( req.cookies?.[ SESSION_COOKIE ] === 'authenticated' || isInternalCall ) {
        next()
    } else {
        res.status( 401 ).json( { error: 'Not authenticated' } )
    }
}

app.use( '/mcp', requireAuth )

// --- CORS ---
const corsOrigin = env[ 'CORS_ORIGIN' ]
if( corsOrigin ) {
    app.use( ( req, res, next ) => {
        res.header( 'Access-Control-Allow-Origin', corsOrigin )
        res.header( 'Access-Control-Allow-Headers', 'Content-Type, mcp-session-id' )
        res.header( 'Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS' )

        if( req.method === 'OPTIONS' ) {
            res.sendStatus( 204 )

            return
        }

        next()
    } )
}

// --- Request Logging ---
app.use( ( req, res, next ) => {
    const start = Date.now()

    res.on( 'finish', () => {
        const duration = Date.now() - start

        console.log( `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms` )
    } )

    next()
} )


async function startServer() {
    console.log( 'Loading agent manifests and schemas...' )

    // --- Sub-Agent: Bahnhofs-Ueberleben ---
    const bahnhofManifest = await loadManifest( { path: './agents/bahnhofs-ueberleben/agent.mjs' } )
    const bahnhofSchemas = await loadSchemas( {
        providers: [
            'overpass-mobility',
            'transport-rest-db',
            'nominatim',
            'bright-sky',
            'datetime-utils'
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
            'bright-sky',
            'datetime-utils'
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


    // --- Sub-Agent: Radparken + V-Locker ---
    const radparkenManifest = await loadManifest( { path: './agents/radparken/agent.mjs' } )
    const radparkenSchemas = await loadSchemas( {
        providers: [
            'overpass-mobility',
            'transport-rest-db',
            'nominatim',
            'bright-sky',
            'nextbike',
            'infravelo'
        ]
    } )

    const vlockerModule = await import( new URL( './agents/radparken/schemas/vlocker.mjs', import.meta.url ).href )
    radparkenSchemas.push( vlockerModule.main )
    console.log( '  V-Locker schema loaded (3 tools)' )

    const { mcp: radparkenMcp } = await AgentToolsServer.fromManifest( {
        manifest: radparkenManifest,
        llm: LLM,
        schemas: radparkenSchemas,
        elicitation: true,
        routePath: '/mcp/radparken'
    } )
    app.use( radparkenMcp.middleware() )
    app.use( radparkenMcp.sseMiddleware() )
    console.log( '  /mcp/radparken — Radparken + V-Locker (ready)' )


    // --- Sub-Agent: Anschluss-Navigator ---
    const navigatorManifest = await loadManifest( { path: './agents/anschluss-navigator/agent.mjs' } )
    const navigatorSchemas = await loadSchemas( {
        providers: [
            'transport-rest-db',
            'transport-rest-vbb',
            'overpass-mobility',
            'bright-sky',
            'nominatim'
        ]
    } )

    const { mcp: navigatorMcp } = await AgentToolsServer.fromManifest( {
        manifest: navigatorManifest,
        llm: LLM,
        schemas: navigatorSchemas,
        elicitation: true,
        routePath: '/mcp/navigator'
    } )
    app.use( navigatorMcp.middleware() )
    app.use( navigatorMcp.sseMiddleware() )
    console.log( '  /mcp/navigator — Anschluss-Navigator (ready)' )


    // --- Main Agent ---
    const mainManifest = await loadManifest( { path: './agents/anschluss-mobility/agent.mjs' } )

    const { mcp: mainMcp } = await AgentToolsServer.fromManifest( {
        manifest: mainManifest,
        llm: LLM,
        schemas: [],
        subAgents: {
            'bahnhofs-ueberleben': { url: `http://localhost:${PORT}/mcp/bahnhof` },
            'ticketkauf': { url: `http://localhost:${PORT}/mcp/tickets` },
            'radparken': { url: `http://localhost:${PORT}/mcp/radparken` },
            'anschluss-navigator': { url: `http://localhost:${PORT}/mcp/navigator` }
        },
        elicitation: true,
        routePath: '/mcp/main'
    } )
    app.use( mainMcp.middleware() )
    app.use( mainMcp.sseMiddleware() )
    console.log( '  /mcp/main — Anschluss-Mobility Main Agent (ready)' )


    // --- Agent Card (/.well-known/agent.json) ---
    app.get( '/.well-known/agent.json', ( req, res ) => {
        res.json( {
            name: 'Anschluss Mobility',
            description: 'Multi-agent mobility system for German train travel. Finds tickets, helps stranded travelers, navigates cities, and compares prices across DB and FlixBus.',
            url: req.headers.host ? `${req.protocol}://${req.headers.host}` : `http://localhost:${PORT}`,
            version: '1.0.0',
            capabilities: {
                mcp: {
                    endpoints: [
                        { path: '/mcp/main', description: 'Main Agent — routes to sub-agents' },
                        { path: '/mcp/bahnhof', description: 'Stranded traveler emergency assistant' },
                        { path: '/mcp/tickets', description: 'Ticket price optimizer (DB vs FlixBus)' },
                        { path: '/mcp/radparken', description: 'Bike parking + V-Locker availability' },
                        { path: '/mcp/navigator', description: 'Real-time connection check for delays' }
                    ]
                }
            },
            contact: {
                name: 'FlowMCP',
                url: 'https://github.com/FlowMCP'
            }
        } )
    } )


    // --- Health endpoint ---
    app.get( '/health', ( req, res ) => {
        res.json( {
            status: 'ok',
            agents: [
                'anschluss-mobility',
                'bahnhofs-ueberleben',
                'ticketkauf',
                'radparken',
                'anschluss-navigator'
            ],
            uptime: Math.floor( process.uptime() )
        } )
    } )


    // --- Global Error Handler ---
    app.use( ( err, req, res, _next ) => {
        console.error( `[Error] ${req.method} ${req.path}: ${err.message}` )

        const statusCode = err.code === 'MAS_LLM_CONFIG_MISSING' ? 503 : 500

        res.status( statusCode ).json( {
            error: 'Internal Server Error',
            code: err.code || 'MAS_INTERNAL'
        } )
    } )


    const server = app.listen( PORT, () => {
        console.log( `\nHackathon Anschluss-Mobility Server running on http://localhost:${PORT}` )
        console.log( `  Main Agent:  POST http://localhost:${PORT}/mcp/main` )
        console.log( `  Events SSE:  GET  http://localhost:${PORT}/events` )
        console.log( `  Health:      GET  http://localhost:${PORT}/health` )
    } )


    // --- Graceful Shutdown ---
    const shutdown = () => {
        console.log( '\n[Shutdown] SIGTERM received, closing server...' )

        server.close( () => {
            console.log( '[Shutdown] Server closed.' )
            process.exit( 0 )
        } )

        setTimeout( () => {
            console.error( '[Shutdown] Forced exit after 30s timeout.' )
            process.exit( 1 )
        }, 30000 )
    }

    process.on( 'SIGTERM', shutdown )
    process.on( 'SIGINT', shutdown )
}


startServer()
    .catch( ( error ) => {
        console.error( 'Failed to start server:', error )
        process.exit( 1 )
    } )
