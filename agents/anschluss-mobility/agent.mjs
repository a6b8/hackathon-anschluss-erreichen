export const agent = {
    name: 'anschluss-mobility',
    description: 'Master mobility agent for German train travel. Routes queries to 5 specialized sub-agents: ticket booking (Sparpreise), connection transfers (delays), station survival (stranded), city navigation (unknown cities), and bike parking. 95+ data sources, works at any station in Germany.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: `Du bist der Anschluss-Mobilitaets-Agent — ein Reiseassistent fuer Zugreisende in Deutschland. Du hast 5 spezialisierte Module:

1. **Ticketkauf** — Sparpreise finden, Bahn vs FlixBus vergleichen
2. **Anschluss-Navigator** — Verspaetung? Schaffe ich den Anschluss?
3. **Bahnhofs-Ueberleben** — Gestrandet? Toilette, Waerme, Hotel finden
4. **Stadt-Navigator** — Fremde Stadt? Orientierung und OEPNV
5. **Radparken** — Sicheres Fahrradparken am Bahnhof

Entscheide anhand der Frage welches Modul am besten passt:

- "guenstig", "Preis", "Sparpreis", "was kostet" → Ticketkauf
- "Verspaetung", "Anschluss", "schaffe ich", "verpasst" → Anschluss-Navigator
- "gestrandet", "23 Uhr", "ausgefallen", "Toilette", "Hotel" → Bahnhofs-Ueberleben
- "wie komme ich", "kenne die Stadt nicht", "Innenstadt" → Stadt-Navigator
- "Fahrrad", "Radparken", "abstellen", "Rad" → Radparken

SOFORT HANDELN (KEINE Rueckfrage) wenn:
- User nennt einen konkreten Ort ("Bahnhof Regensburg", "in Marburg")
- User stellt eine direkte Frage ("Wie kalt ist es?", "Wann faehrt der naechste Zug?", "Gibt es Toiletten?")
- User beschreibt eine klare Situation ("Zug ausgefallen", "bin gestrandet", "habe Verspaetung")

KURZ NACHFRAGEN wenn:
- User nennt KEINEN Ort ("Hilfe, ich bin gestrandet" — WO?)
- User hat kein klares Ziel ("Was kostet ein Zug?" — WOHIN?)
- Situation ist mehrdeutig ("Mein Zug hat Verspaetung" — WELCHER Zug, WO?)

Rueckfrage-Format: Maximal 1 Satz, dann sofort die fehlende Info erfragen.

Antworte immer auf Deutsch. Sei empathisch bei Stress-Situationen. Sei direkt und konkret.`,
    tools: {
        // Sub-agents registered as tools
        // In production: these would be MCP agent references
        // For hackathon: we reference the tool schemas directly

        // Ticketkauf tools
        'transportrestdb/tool/planJourney': null,
        'transportrestdb/tool/searchLocations': null,
        'flixbus/tool/searchTrips': null,
        'flixbus/tool/autocompleteCities': null,

        // Anschluss-Navigator tools
        'transportrestdb/tool/getDepartures': null,
        'transportrestdb/tool/getArrivals': null,
        'transportrestdb/tool/getNearbyLocations': null,
        'transportrestvbb/tool/getDepartures': null,
        'transportrestvbb/tool/getRadar': null,
        'transportrestvbb/tool/getReachableFrom': null,

        // Bahnhofs-Ueberleben tools
        'overpassmobility/tool/findStationAmenities': null,
        'overpassmobility/tool/findStationMobility': null,
        'overpassmobility/tool/findAccommodation': null,
        'overpassmobility/tool/findAccessibility': null,
        'overpassmobility/tool/findBikeInfrastructure': null,

        // Shared tools (used by multiple modules)
        'nominatim/tool/forwardGeocode': null,
        'brightsky/tool/getCurrentWeather': null,
        'nextbike/tool/getStationsAndBikes': null,
        'dottescooter/tool/getFreeBikes': null,
        'infravelo/tool/getAllProjects': null,

        // DB Marketplace (enable when keys available)
        // 'dbstada/tool/searchStations': null,
        // 'dbstada/tool/getStationById': null,
        // 'dbfasta/tool/getStationFacilities': null,
        // 'dbrisconnections/tool/getConnections': null,
        // 'dbrisboards/tool/getDepartures': null,
        // 'dbparking/tool/getAllParkingSpaces': null,
        // 'dbsharedmobility/tool/getStationStatus': null,
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'route-query': { file: './skills/route-query.mjs' }
    },
    tests: [
        {
            _description: 'Price query routes to Ticketkauf',
            input: 'Was kostet ein Zug von Berlin nach Muenchen?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'transportrestdb/tool/planJourney'
            ],
            expectedContent: [ 'Preis', 'Berlin', 'Muenchen' ]
        },
        {
            _description: 'Delay query routes to Anschluss-Navigator',
            input: 'Mein ICE hat 20 Minuten Verspaetung, schaffe ich noch den Anschluss in Hannover?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'transportrestdb/tool/getDepartures'
            ],
            expectedContent: [ 'Verspaetung', 'Anschluss' ]
        },
        {
            _description: 'Stranded query routes to Bahnhofs-Ueberleben',
            input: 'Es ist 23 Uhr, mein Zug in Leipzig ist ausgefallen, wo finde ich eine Toilette und ein Hotel?',
            expectedTools: [
                'overpassmobility/tool/findStationAmenities',
                'overpassmobility/tool/findAccommodation'
            ],
            expectedContent: [ 'Toilette', 'Hotel' ]
        },
        {
            _description: 'City navigation query',
            input: 'Bin gerade in Frankfurt angekommen, wie komme ich zur Messe?',
            expectedTools: [
                'nominatim/tool/forwardGeocode',
                'transportrestdb/tool/planJourney'
            ],
            expectedContent: [ 'Frankfurt', 'Messe' ]
        },
        {
            _description: 'Bike parking query routes to Radparken',
            input: 'Gibt es ueberdachtes Radparken am Bahnhof Jannowitzbruecke?',
            expectedTools: [
                'overpassmobility/tool/findBikeInfrastructure'
            ],
            expectedContent: [ 'Radparken', 'ueberdacht' ]
        }
    ],
    maxRounds: 8,
    maxTokens: 4096,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Any mobility question: ticket prices, delays, stranded situation, city navigation, or bike parking'
            }
        },
        required: ['query']
    }
}
