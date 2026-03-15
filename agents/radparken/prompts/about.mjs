const content = `
# Radparken — Sicheres Fahrradparken am Bahnhof

Finde Radstellplaetze an jedem deutschen Bahnhof. Mit Kapazitaet, Typ, ueberdacht-Status und Alternativen.

## Beispiele
- "Wo kann ich mein Rad am Berlin Hbf sicher abstellen?"
- "Ueberdachtes Radparken an der Jannowitzbruecke?"
- "Gibt es Schliessfaecher fuer Fahrraeder am Potsdam Hbf?"
- "Radparken Bad Belzig — gibt es da ueberhaupt was?"
`

export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'radparken',
    description: 'Describes the Radparken bike parking agent',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    dependsOn: [ 'overpassmobility/tool/findBikeInfrastructure', 'nextbike/tool/getStationsAndBikes' ],
    references: [],
    content
}
