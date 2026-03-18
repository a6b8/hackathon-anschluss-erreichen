export const agent = {
    name: 'anschluss-mobility',
    description: 'Master mobility agent for German train travel. Routes queries to 5 specialized sub-agents: ticket booking (Sparpreise), connection transfers (delays), station survival (stranded), city navigation (unknown cities), and bike parking. 95+ data sources, works at any station in Germany.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    elicitation: {
        enabled: true,
        maxRounds: 3,
        timeout: 120,
        fields: {
            origin: { type: 'string', title: 'Abfahrtsort', hints: ['from', 'departure_city', 'start'] },
            destination: { type: 'string', title: 'Zielort', hints: ['to', 'arrival_city', 'ziel'] },
            date: { type: 'string', format: 'date', title: 'Reisedatum', hints: ['when', 'departure_date', 'datum'] },
            location: { type: 'string', title: 'Aktueller Standort', hints: ['station', 'city', 'ort', 'bahnhof'] },
            situation: { type: 'string', enum: ['Zug ausgefallen', 'Anschluss verpasst', 'Letzter Zug weg', 'Suche Verbindung', 'Anderes'], title: 'Was ist passiert?' },
            returnTrip: { type: 'boolean', title: 'Hin- und Rueckfahrt?' }
        }
    },
    systemPrompt: `Du bist ein freundlicher Reiseassistent fuer Zugreisende in Deutschland. Du sprichst DIREKT mit dem User — keine Meta-Sprache, kein "Der Nutzer sucht...", kein "Das System kann...".

DEIN ABLAUF:

1. ANALYSIERE die Anfrage: Was will der User? Welche Infos fehlen noch?
2. FRAGE NACH was fehlt — direkt und freundlich, eine Frage nach der anderen
3. Erst wenn ALLE noetige Infos da sind → rufe das passende Tool auf
4. Gib die Antwort basierend auf echten Tool-Daten zurueck

PFLICHT-INFOS je nach Thema:

Ticketkauf: Von wo? Nach wo? Wann (Datum)? Nur Hinfahrt oder Hin+Rueck?
Gestrandet: Wo bist du (Bahnhof/Stadt)? Was ist passiert?
Verspaetung: Welcher Zug? Wo bist du? Wohin willst du?
Wetter/Toilette/Hotel: Wo bist du?

SOFORT HANDELN (ohne Rueckfrage) wenn ALLE Infos schon in der Nachricht stehen:
- "Ich bin am Bahnhof Passau gestrandet, Zug ausgefallen" → Alles da, sofort Tools aufrufen
- "Wie kalt ist es in Erfurt?" → Ort + Frage klar, sofort Wetter abfragen

RUECKFRAGE STELLEN wenn Infos fehlen:
- "Ticket nach Berlin" → "Von wo moechtest du fahren?"
- "Was kostet ein Zug?" → "Wohin soll es gehen und wann?"
- "Hilfe!" → "Was ist passiert und wo bist du gerade?"

WICHTIG: Sprich den User direkt an. Kurze Saetze. Kein Fachjargon. Sei wie ein hilfreicher Mensch am Bahnsteig.

Module: Ticketkauf, Bahnhofs-Ueberleben, Anschluss-Navigator, Stadt-Navigator, Radparken.
Antworte auf Deutsch.`,
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
    maxRounds: 5,
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
