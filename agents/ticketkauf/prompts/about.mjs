const content = `
# Ticketkauf — Sparpreis-Finder

Finde die guenstigste Zugverbindung quer durch Deutschland. Vergleicht DB Sparpreise mit FlixBus und FlixTrain.

## Beispiele
- "Berlin nach Freiburg, naechste Woche, moeglichst guenstig"
- "ICE Direktzug Hamburg Muenchen, was kostet das?"
- "Wann ist der guenstigste Tag Berlin Stuttgart?"
- "Vergleich Bahn vs FlixBus nach Koeln"
`

export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'ticketkauf',
    description: 'Describes the Ticketkauf price comparison agent',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    dependsOn: [
        'transportrestdb/tool/planJourney',
        'flixbus/tool/searchTrips'
    ],
    references: [],
    content
}
