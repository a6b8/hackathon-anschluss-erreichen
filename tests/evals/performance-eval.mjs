/**
 * Eval: Performance Metrics
 *
 * Extracts timing and token usage from structured logger output.
 *
 * Usage:
 *   node tests/evals/performance-eval.mjs --file server.log
 *   cat server.log | node tests/evals/performance-eval.mjs
 */

import { readFile } from 'node:fs/promises'


const LOG_PATTERN = /\[(\S+)\]\s+\[(\w+)\]\s+\[(\w+)\]\s+(.+)/
const TIMING_PATTERN = /(\d+)ms/


const parseLogLine = ( line ) => {
    const match = line.match( LOG_PATTERN )

    if( !match ) {
        return null
    }

    const [ , timestamp, level, component, message ] = match

    return { timestamp, level, component, message }
}


const extractMetrics = ( lines ) => {
    const entries = lines
        .map( parseLogLine )
        .filter( ( e ) => e !== null )

    const rounds = entries
        .filter( ( e ) => e.message.includes( 'Round' ) )
        .map( ( e ) => {
            const roundMatch = e.message.match( /Round\s+(\d+)/ )

            return {
                round: roundMatch ? parseInt( roundMatch[ 1 ] ) : 0,
                timestamp: e.timestamp
            }
        } )

    const timings = entries
        .filter( ( e ) => TIMING_PATTERN.test( e.message ) )
        .map( ( e ) => {
            const match = e.message.match( TIMING_PATTERN )

            return {
                ms: match ? parseInt( match[ 1 ] ) : 0,
                message: e.message
            }
        } )

    const tokenEntries = entries
        .filter( ( e ) => e.message.includes( 'token' ) || e.message.includes( 'Token' ) )

    return { rounds, timings, tokenEntries, totalEntries: entries.length }
}


const run = async () => {
    console.log( '\n=== Performance Eval ===\n' )

    let input = ''
    const fileArg = process.argv.indexOf( '--file' )

    if( fileArg !== -1 && process.argv[ fileArg + 1 ] ) {
        input = await readFile( process.argv[ fileArg + 1 ], 'utf-8' )
    } else if( !process.stdin.isTTY ) {
        const chunks = []

        for await ( const chunk of process.stdin ) {
            chunks.push( chunk )
        }

        input = Buffer.concat( chunks ).toString()
    } else {
        console.log( 'No input provided.' )
        console.log( 'Usage: node performance-eval.mjs --file server.log' )
        process.exit( 0 )
    }

    const lines = input.split( '\n' ).filter( ( l ) => l.trim() )
    const metrics = extractMetrics( lines )

    console.log( `Total log entries: ${metrics.totalEntries}` )
    console.log( `Rounds detected: ${metrics.rounds.length}` )
    console.log( `Timing entries: ${metrics.timings.length}` )
    console.log( `Token entries: ${metrics.tokenEntries.length}` )

    if( metrics.timings.length > 0 ) {
        const totalMs = metrics.timings.reduce( ( sum, t ) => sum + t.ms, 0 )
        const avgMs = Math.round( totalMs / metrics.timings.length )
        const maxMs = Math.max( ...metrics.timings.map( ( t ) => t.ms ) )
        const minMs = Math.min( ...metrics.timings.map( ( t ) => t.ms ) )

        console.log( '\nTiming Summary:' )
        console.log( `  Total: ${totalMs}ms` )
        console.log( `  Avg:   ${avgMs}ms` )
        console.log( `  Min:   ${minMs}ms` )
        console.log( `  Max:   ${maxMs}ms` )
    }

    if( metrics.rounds.length > 0 ) {
        console.log( `\nMax Round: ${Math.max( ...metrics.rounds.map( ( r ) => r.round ) )}` )
    }

    if( metrics.tokenEntries.length > 0 ) {
        console.log( '\nToken Log Entries:' )
        metrics.tokenEntries.forEach( ( e ) => {
            console.log( `  ${e.message}` )
        } )
    }

    console.log( '\n=== Done ===' )
}


run().catch( ( err ) => {
    console.error( `FATAL: ${err.message}` )
    process.exit( 1 )
} )
