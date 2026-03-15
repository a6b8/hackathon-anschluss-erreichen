const content = `
# Anschluss-Navigator

Dein Zug hat Verspaetung. Schaffst du den Anschluss noch? Dieser Agent prueft das in Echtzeit und findet sofort Alternativen.

## Was kann ich?

- **Anschluss pruefen**: Reicht die Umsteigezeit trotz Verspaetung?
- **Alternativen finden**: Naechster Zug, Bus, U-Bahn, Rad, E-Scooter
- **Wetter beruecksichtigen**: Rad nur bei gutem Wetter empfehlen
- **Live-Positionen**: In Berlin zeige ich dir wo Busse/Bahnen gerade sind
- **Fernreise-Routing**: ICE verpasst? Naechste Verbindung nach Muenchen?

## Beispiele

- "RE1 hat 15 Min Verspaetung, schaffe ich die S1 in Berlin Hbf?"
- "ICE-Anschluss in Hamburg verpasst. Wie weiter nach Muenchen?"
- "S-Bahn Stoerung am Alex. Wie komme ich zum Ostbahnhof?"
- "Bin in Hannover, Zug faellt aus. Was faehrt als naechstes nach Berlin?"
`


export const prompt = {
    name: 'about',
    version: 'flowmcp-prompt/1.0.0',
    agent: 'anschluss-navigator',
    description: 'Describes the Anschluss-Navigator agent and how to use it',
    testedWith: 'anthropic/claude-sonnet-4-5-20250929',
    dependsOn: [
        'transportrestdb/tool/getDepartures',
        'transportrestdb/tool/planJourney',
        'overpassmobility/tool/findStationMobility',
        'brightsky/tool/getCurrentWeather'
    ],
    references: [],
    content
}
