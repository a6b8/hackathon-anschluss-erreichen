/**
 * Eval: Tool Usage Analysis
 *
 * Parses structured logger output to analyze which tools were called,
 * how often, and in what order.
 *
 * Usage:
 *   node tests/evals/tool-usage-eval.mjs < server.log
 *   node tests/evals/tool-usage-eval.mjs --file server.log
 */

import { readFile } from 'node:fs/promises'


const LOG_PATTERN = /\[(\S+)\]\s+\[(\w+)\]\s+\[(\w+)\]\s+(.+)/


const parseLogLine = ( line ) => {
    const match = line.match( LOG_PATTERN )

    if( !match ) {
        return null
    }

    const [ , timestamp, level, component, message ] = match

    return { timestamp, level, component, message }
}


const extractToolCalls = ( lines ) => {
    return lines
        .map( parseLogLine )
        .filter( ( entry ) => entry !== null )
        .filter( ( entry ) => entry.message.includes( 'tool_call' ) || entry.message.includes( 'Calling tool' ) )
        .map( ( entry ) => {
            const toolMatch = entry.message.match( /tool[_\s]*(?:call|:)\s*(\S+)/i )

            return {
                timestamp: entry.timestamp,
                component: entry.component,
                tool: toolMatch ? toolMatch[ 1 ] : 'unknown'
            }
        } )
}


const analyzeToolUsage = ( toolCalls ) => {
    const frequency = {}
    const order = []

    toolCalls.forEach( ( call ) => {
        frequency[ call.tool ] = ( frequency[ call.tool ] || 0 ) + 1
        order.push( call.tool )
    } )

    return { frequency, order, total: toolCalls.length }
}


const run = async () => {
    console.log( '\n=== Tool Usage Eval ===\n' )

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
        console.log( 'Usage: node tool-usage-eval.mjs --file server.log' )
        console.log( '   or: cat server.log | node tool-usage-eval.mjs' )
        process.exit( 0 )
    }

    const lines = input.split( '\n' ).filter( ( l ) => l.trim() )
    const toolCalls = extractToolCalls( lines )
    const analysis = analyzeToolUsage( toolCalls )

    console.log( `Total log lines: ${lines.length}` )
    console.log( `Tool calls found: ${analysis.total}` )
    console.log()

    console.log( 'Frequency:' )
    Object.entries( analysis.frequency )
        .sort( ( [ , a ], [ , b ] ) => b - a )
        .forEach( ( [ tool, count ] ) => {
            console.log( `  ${tool}: ${count}x` )
        } )

    console.log( '\nCall order:' )
    analysis.order.forEach( ( tool, idx ) => {
        console.log( `  ${idx + 1}. ${tool}` )
    } )

    console.log( '\n=== Done ===' )
}


run().catch( ( err ) => {
    console.error( `FATAL: ${err.message}` )
    process.exit( 1 )
} )
