/**
 * Statistics Generator
 *
 * Reads batch test results and generates analysis reports.
 *
 * Usage:
 *   node tests/evals/stats-generator.mjs --input logs/batch-2026-03-18/
 *   node tests/evals/stats-generator.mjs --input logs/batch-2026-03-18/ --compare logs/batch-2026-03-17/
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'


const args = process.argv.slice( 2 )
const getArg = ( name ) => {
    const idx = args.indexOf( `--${name}` )
    return idx !== -1 && args[ idx + 1 ] ? args[ idx + 1 ] : null
}

const INPUT_DIR = getArg( 'input' )
const COMPARE_DIR = getArg( 'compare' )

if( !INPUT_DIR ) {
    console.error( 'Usage: node stats-generator.mjs --input <batch-dir>' )
    process.exit( 1 )
}


const loadResults = async ( dir ) => {
    const allResultsPath = join( dir, 'all-results.json' )

    try {
        const raw = await readFile( allResultsPath, 'utf-8' )
        return JSON.parse( raw )
    } catch {
        const files = ( await readdir( dir ) )
            .filter( ( f ) => f.endsWith( '.json' ) && f !== 'all-results.json' )

        const results = []

        for( const file of files ) {
            const raw = await readFile( join( dir, file ), 'utf-8' )
            results.push( JSON.parse( raw ) )
        }

        return results
    }
}


const analyzeResults = ( results ) => {
    const total = results.length
    const successful = results.filter( ( r ) => r.success )
    const failed = results.filter( ( r ) => !r.success )

    const avgTime = successful.length > 0
        ? Math.round( successful.reduce( ( sum, r ) => sum + r.totalTime, 0 ) / successful.length )
        : 0

    const toolUsage = {}

    successful.forEach( ( r ) => {
        const metadata = r.metadata || {}
        const toolCalls = metadata.toolCalls || 0
        const rounds = metadata.llmRounds || 0

        if( !toolUsage._meta ) {
            toolUsage._meta = { totalToolCalls: 0, totalRounds: 0, count: 0 }
        }

        toolUsage._meta.totalToolCalls += toolCalls
        toolUsage._meta.totalRounds += rounds
        toolUsage._meta.count++
    })

    const groundTruthResults = successful
        .filter( ( r ) => r.groundTruthCheck?.checked )

    const gtStationOk = groundTruthResults
        .filter( ( r ) => r.groundTruthCheck?.stationMentioned ).length

    const violations = successful
        .filter( ( r ) => r.mustNotContainViolations?.length > 0 )

    const scenarioStats = {}

    results.forEach( ( r ) => {
        if( !scenarioStats[ r.scenarioId ] ) {
            scenarioStats[ r.scenarioId ] = { runs: [], success: 0, failed: 0 }
        }

        scenarioStats[ r.scenarioId ].runs.push( r )

        if( r.success ) {
            scenarioStats[ r.scenarioId ].success++
        } else {
            scenarioStats[ r.scenarioId ].failed++
        }
    } )

    const consistency = Object.entries( scenarioStats )
        .filter( ( [ , stats ] ) => stats.runs.length > 1 )
        .map( ( [ id, stats ] ) => {
            const successRuns = stats.runs.filter( ( r ) => r.success )
            const allSame = successRuns.length === stats.runs.length

            return { id, runs: stats.runs.length, allSuccess: allSame }
        } )

    return {
        total,
        successCount: successful.length,
        failedCount: failed.length,
        successRate: total > 0 ? Math.round( ( successful.length / total ) * 100 ) : 0,
        avgTime,
        groundTruth: {
            checked: groundTruthResults.length,
            stationMentioned: gtStationOk,
            stationRate: groundTruthResults.length > 0 ? Math.round( ( gtStationOk / groundTruthResults.length ) * 100 ) : 0
        },
        violations: violations.length,
        consistency,
        scenarioStats
    }
}


const generateMarkdown = ( stats, compareStats ) => {
    let md = `# Batch Test Report

**Total Runs:** ${stats.total}
**Success:** ${stats.successCount} (${stats.successRate}%)
**Failed:** ${stats.failedCount}
**Avg Response Time:** ${stats.avgTime}ms

## Ground Truth

| Metric | Value |
|--------|-------|
| Scenarios checked | ${stats.groundTruth.checked} |
| Station mentioned in answer | ${stats.groundTruth.stationMentioned} (${stats.groundTruth.stationRate}%) |
| Must-not-contain violations | ${stats.violations} |

`

    if( compareStats ) {
        md += `## Comparison with Previous Batch

| Metric | Previous | Current | Delta |
|--------|----------|---------|-------|
| Success Rate | ${compareStats.successRate}% | ${stats.successRate}% | ${stats.successRate - compareStats.successRate}% |
| Avg Time | ${compareStats.avgTime}ms | ${stats.avgTime}ms | ${stats.avgTime - compareStats.avgTime}ms |
| Station Mentioned | ${compareStats.groundTruth.stationRate}% | ${stats.groundTruth.stationRate}% | ${stats.groundTruth.stationRate - compareStats.groundTruth.stationRate}% |
| Violations | ${compareStats.violations} | ${stats.violations} | ${stats.violations - compareStats.violations} |

`
    }

    md += `## Per-Scenario Results

| Scenario | Runs | Success | Time | Station | Violations |
|----------|------|---------|------|---------|------------|
`

    Object.entries( stats.scenarioStats )
        .forEach( ( [ id, data ] ) => {
            const successRuns = data.runs.filter( ( r ) => r.success )
            const avgTime = successRuns.length > 0
                ? Math.round( successRuns.reduce( ( s, r ) => s + r.totalTime, 0 ) / successRuns.length )
                : '-'

            const stationOk = successRuns
                .filter( ( r ) => r.groundTruthCheck?.stationMentioned ).length

            const viols = successRuns
                .filter( ( r ) => r.mustNotContainViolations?.length > 0 ).length

            md += `| ${id} | ${data.runs.length} | ${data.success}/${data.runs.length} | ${avgTime}ms | ${stationOk}/${successRuns.length} | ${viols} |\n`
        } )

    if( stats.consistency.length > 0 ) {
        md += `\n## Consistency (Multi-Run)\n\n`
        md += `| Scenario | Runs | All Success |\n`
        md += `|----------|------|-------------|\n`

        stats.consistency.forEach( ( c ) => {
            md += `| ${c.id} | ${c.runs} | ${c.allSuccess ? 'Yes' : 'No'} |\n`
        } )
    }

    return md
}


const run = async () => {
    console.log( `\n=== Statistics Generator ===` )
    console.log( `Input: ${INPUT_DIR}` )

    const results = await loadResults( INPUT_DIR )
    console.log( `Results loaded: ${results.length}` )

    const stats = analyzeResults( results )

    let compareStats = null

    if( COMPARE_DIR ) {
        console.log( `Comparing with: ${COMPARE_DIR}` )
        const compareResults = await loadResults( COMPARE_DIR )
        compareStats = analyzeResults( compareResults )
    }

    const markdown = generateMarkdown( stats, compareStats )
    const reportPath = join( INPUT_DIR, 'report.md' )
    const jsonPath = join( INPUT_DIR, 'stats.json' )

    await writeFile( reportPath, markdown, 'utf-8' )
    await writeFile( jsonPath, JSON.stringify( stats, null, 2 ), 'utf-8' )

    console.log( `\nReport: ${reportPath}` )
    console.log( `JSON:   ${jsonPath}` )
    console.log( `\n${markdown}` )
}


run().catch( ( err ) => {
    console.error( `FATAL: ${err.message}` )
    process.exit( 1 )
} )
