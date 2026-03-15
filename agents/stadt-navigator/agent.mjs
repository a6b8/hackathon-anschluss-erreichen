export const agent = {
    name: 'stadt-navigator',
    description: 'Navigate unfamiliar German cities from a train station. Find local transport, get OEPNV routing, discover nearby amenities, and use sharing mobility. Works in any city — not just Berlin.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: `Du bist ein Stadt-Navigator fuer Reisende die an einem Bahnhof ankommen und sich nicht auskennen. Du hilfst von "Wo bin ich?" bis "Wie komme ich zu meinem Ziel?".

Verhalte dich so:
1. Gehe davon aus, dass der User die Stadt NICHT kennt. Erklaere kurz wo er ist.
2. Finde OEPNV-Verbindungen zum Ziel (Bus, U-Bahn, Tram, S-Bahn).
3. Zeige Sharing-Optionen als schnelle Alternative (E-Scooter, Fahrrad).
4. Erwaehne was in der Naehe ist (Essen, Trinken, Einkaufen) — Ankommen = Beduerfnisse.
5. Funktioniere in JEDER deutschen Stadt, nicht nur in Berlin.
6. Antworte auf Deutsch.

Struktur:
1. **Wo du bist** — Kurze Orientierung
2. **So kommst du hin** — OEPNV-Route zum Ziel
3. **Schnelle Alternativen** — Scooter, Rad, Taxi
4. **Was ist in der Naehe** — Essen, Trinken, Einkaufen`,
    tools: {
        'transportrestdb/tool/searchLocations': null,
        'transportrestdb/tool/getDepartures': null,
        'transportrestdb/tool/planJourney': null,
        'transportrestvbb/tool/getDepartures': null,
        'transportrestvbb/tool/planJourney': null,
        'vrrefa/tool/getDepartures': null,
        'vrrefa/tool/planTrip': null,
        'nominatim/tool/forwardGeocode': null,
        'overpassmobility/tool/findStationMobility': null,
        'overpassmobility/tool/findStationAmenities': null,
        'dottescooter/tool/getFreeBikes': null,
        'nextbike/tool/getStationsAndBikes': null,
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'city-orient': { file: './skills/city-orient.mjs' }
    },
    tests: [
        {
            _description: 'Frankfurt Sued to Hauptbahnhof',
            input: 'Ich bin am Frankfurt Sued, wie komme ich zum Hauptbahnhof?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'transportrestdb/tool/planJourney'
            ],
            expectedContent: [ 'Frankfurt', 'Hauptbahnhof' ]
        },
        {
            _description: 'Arriving in unknown city',
            input: 'Bin gerade in Goettingen angekommen, kenne die Stadt nicht. Wo kann ich was essen und wie komme ich in die Innenstadt?',
            expectedTools: [
                'nominatim/tool/forwardGeocode',
                'overpassmobility/tool/findStationAmenities',
                'overpassmobility/tool/findStationMobility'
            ],
            expectedContent: [ 'Goettingen', 'Restaurant', 'Bus' ]
        },
        {
            _description: 'Need to get to a specific address',
            input: 'Bin am Leipzig Hbf, muss zur Universitaet Leipzig, Augustusplatz. Wie komme ich da hin?',
            expectedTools: [
                'nominatim/tool/forwardGeocode',
                'transportrestdb/tool/planJourney'
            ],
            expectedContent: [ 'Leipzig', 'Augustusplatz' ]
        }
    ],
    maxRounds: 6,
    maxTokens: 4096,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Where are you and where do you need to go?'
            }
        },
        required: ['query']
    }
}
