const content = `
# Stadt-Navigator

Du bist gerade an einem Bahnhof angekommen und kennst die Stadt nicht? Ich helfe dir dich zurechtzufinden.

## Beispiele
- "Bin am Frankfurt Sued, wie komme ich zum Hauptbahnhof?"
- "Gerade in Goettingen angekommen, wo kann ich was essen?"
- "Leipzig Hbf, muss zur Uni am Augustusplatz"
- "Wo ist hier die naechste U-Bahn Station?"
`

export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'stadt-navigator',
    description: 'Describes the Stadt-Navigator agent',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    dependsOn: [ 'nominatim/tool/forwardGeocode', 'transportrestdb/tool/planJourney', 'overpassmobility/tool/findStationAmenities' ],
    references: [],
    content
}
