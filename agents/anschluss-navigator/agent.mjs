export const agent = {
    name: 'anschluss-navigator',
    description: 'Real-time connection assistant for delayed trains. Checks if your transfer is still reachable, finds alternatives (next train, bike, e-scooter, bus), considers weather and accessibility. Helps you make the best decision under time pressure.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: `Du bist ein Echtzeit-Anschluss-Berater fuer Zugreisende. Wenn jemand eine Verspaetung hat oder einen Anschluss zu verpassen droht, hilfst du sofort mit konkreten Optionen.

Verhalte dich so:
1. Sei schnell und direkt: In einer Verspaetungssituation zaehlt jede Minute. Keine langen Erklaerungen.
2. Pruefe zuerst ob der Anschluss noch erreichbar ist (Umsteigezeit vs. Verspaetung).
3. Zeige IMMER Alternativen — auch wenn der Anschluss klappt. Plan B ist wichtig.
4. Beruecksichtige das Wetter: Bei Regen kein Fahrrad empfehlen, bei Sonnenschein schon.
5. Erwaehne Aufzug-Status wenn der Umstieg Gleisewechsel erfordert (Barrierefreiheit).
6. Zeige Sharing-Optionen (nextbike, Dott E-Scooter) als schnelle Alternativen.
7. Bei Streik oder Unwetter: Warne sofort und zeige Ausweich-Optionen.
8. Antworte auf Deutsch.

Struktur deiner Antwort:
1. **Lage** — Dein Zug, Verspaetung, Anschluss-Status
2. **Empfehlung** — Was du jetzt tun solltest
3. **Alternativen** — Plan B, C, D
4. **Kontext** — Wetter, Barrierefreiheit, Warnungen`,
    tools: {
        'transportrestdb/tool/searchLocations': null,
        'transportrestdb/tool/getDepartures': null,
        'transportrestdb/tool/getArrivals': null,
        'transportrestdb/tool/planJourney': null,
        'transportrestdb/tool/getNearbyLocations': null,
        'transportrestvbb/tool/getDepartures': null,
        'transportrestvbb/tool/getRadar': null,
        'transportrestvbb/tool/getReachableFrom': null,
        'overpassmobility/tool/findStationMobility': null,
        'brightsky/tool/getCurrentWeather': null,
        'nextbike/tool/getStationsAndBikes': null,
        'dottescooter/tool/getFreeBikes': null,
        // 'dbrisconnections/tool/getConnections': null,  // DB Key — THE hackathon core tool
        // 'dbrisboards/tool/getDepartures': null,         // DB Key
        // 'dbfasta/tool/getStationFacilities': null,      // DB Key
        // 'nina/tool/getWarningsByAgs': null,
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'connection-check': { file: './skills/connection-check.mjs' }
    },
    tests: [
        {
            _description: 'Delayed RE1 at Berlin Hbf — will I make my S-Bahn?',
            input: 'Mein RE1 hat 15 Minuten Verspaetung, ich muss am Berlin Hbf in die S1 nach Potsdam umsteigen. Schaffe ich das?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'transportrestdb/tool/getDepartures',
                'overpassmobility/tool/findStationMobility'
            ],
            expectedContent: [
                'Verspaetung',
                'Anschluss',
                'Alternative'
            ]
        },
        {
            _description: 'Missed connection in Hamburg — alternatives',
            input: 'Habe gerade meinen ICE-Anschluss in Hamburg verpasst. Naechster ICE nach Muenchen?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'transportrestdb/tool/getDepartures',
                'transportrestdb/tool/planJourney'
            ],
            expectedContent: [
                'naechster',
                'ICE',
                'Muenchen'
            ]
        },
        {
            _description: 'Weather-dependent alternative recommendation',
            input: 'Bin am Alexanderplatz, S-Bahn hat Stoerung. Wie komme ich zum Ostbahnhof?',
            expectedTools: [
                'transportrestvbb/tool/getDepartures',
                'brightsky/tool/getCurrentWeather',
                'overpassmobility/tool/findStationMobility'
            ],
            expectedContent: [
                'Alternative',
                'Bus',
                'Wetter'
            ]
        }
    ],
    maxRounds: 6,
    maxTokens: 4096,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Describe your situation: which train, how much delay, where do you need to go?'
            }
        },
        required: ['query']
    }
}
