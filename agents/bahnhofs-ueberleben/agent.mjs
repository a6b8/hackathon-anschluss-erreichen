export const agent = {
    name: 'bahnhofs-ueberleben',
    description: 'Emergency assistant for stranded travelers at German train stations. Finds toilets, warm shelter, food/drinks open NOW, next trains, hotels, and local transport. Works at ANY station in Germany — from Berlin Hbf to Bad Belzig.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: `Du bist ein Notfall-Assistent fuer gestrandete Reisende an deutschen Bahnhoefen. Dein Ziel ist es, Menschen in Stresssituationen schnell und empathisch zu helfen.

Verhalte dich so:
1. Sei empathisch: "Ich verstehe, dass das stressig ist. Lass uns schauen, was wir tun koennen."
2. Priorisiere menschliche Grundbeduerfnisse: Toilette, Waerme, Trinken — VOR Weiterreise-Planung.
3. Zeige NUR was JETZT offen ist. Ein Cafe das um 20 Uhr schliesst hilft um 23 Uhr nicht.
4. Wenn es kalt/nass ist, erwaehne das und priorisiere Schutz: "Bei 5°C und Regen solltest du als Erstes ins Warme."
5. Gib konkrete Infos: Name, Adresse, Entfernung, Telefonnummer — nicht nur "es gibt Hotels in der Naehe".
6. Wenn der letzte Zug weg ist, sage es ehrlich und zeige Hotel-Optionen.
7. Beruecksichtige Barrierefreiheit wenn der User es erwaehnt.
8. Antworte auf Deutsch, es sei denn der User schreibt auf Englisch.

Strukturiere deine Antwort immer so:
1. **Grundbeduerfnisse** — Toilette, warmer Ort, Trinken/Essen (was JETZT offen ist)
2. **Weiterreise** — Naechster Zug, Bus, Taxi, Sharing-Optionen
3. **Uebernachtung** — Hotels/Hostels wenn noetig (mit Preis wenn verfuegbar)
4. **Orientierung** — Wo bin ich, was ist in der Naehe

Nutze die verfuegbaren Tools um echte, aktuelle Daten zu liefern. Keine erfundenen Infos.`,
    tools: {
        'overpassmobility/tool/findStationAmenities': null,
        'overpassmobility/tool/findStationMobility': null,
        'overpassmobility/tool/findAccommodation': null,
        'overpassmobility/tool/findAccessibility': null,
        'transportrestdb/tool/searchLocations': null,
        'transportrestdb/tool/getDepartures': null,
        'transportrestdb/tool/getNearbyLocations': null,
        'nominatim/tool/forwardGeocode': null,
        'brightsky/tool/getCurrentWeather': null,
        // 'dbstada/tool/searchStations': null,       // Requires DB API Key — enable when available
        // 'dbfasta/tool/getStationFacilities': null,  // Requires DB API Key — enable when available
        // 'nina/tool/getWarningsByAgs': null,          // Enable when AGS lookup is implemented
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'station-survival': { file: './skills/station-survival.mjs' }
    },
    tests: [
        {
            _description: 'Stranded at Leipzig late at night',
            input: 'Ich stehe um 23 Uhr am Bahnhof Leipzig, mein Zug ist ausgefallen. Was jetzt?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'overpassmobility/tool/findStationAmenities',
                'overpassmobility/tool/findAccommodation'
            ],
            expectedContent: [
                'Toilette',
                'Hotel',
                'Zug'
            ]
        },
        {
            _description: 'Stranded at Frankfurt Hbf in rain',
            input: 'Bin am Frankfurt Hauptbahnhof gestrandet, es regnet und ist kalt. Letzter ICE verpasst.',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'brightsky/tool/getCurrentWeather',
                'overpassmobility/tool/findStationAmenities',
                'overpassmobility/tool/findAccommodation'
            ],
            expectedContent: [
                'Waerme',
                'Hotel',
                'naechster Zug'
            ]
        },
        {
            _description: 'Unknown small station',
            input: 'Wurde gerade in Goettingen aus dem Flixtrain geworfen. Kenne die Stadt nicht. Wo bin ich und was mache ich?',
            expectedTools: [
                'nominatim/tool/forwardGeocode',
                'overpassmobility/tool/findStationAmenities',
                'overpassmobility/tool/findStationMobility',
                'transportrestdb/tool/getDepartures'
            ],
            expectedContent: [
                'Goettingen',
                'Toilette',
                'Bus',
                'Zug'
            ]
        },
        {
            _description: 'Wheelchair user needs accessible options',
            input: 'Ich sitze im Rollstuhl und bin am Hannover Hbf gestrandet. Brauche barrierefreies Hotel und Aufzug-Info.',
            expectedTools: [
                'overpassmobility/tool/findAccessibility',
                'overpassmobility/tool/findAccommodation'
            ],
            expectedContent: [
                'barrierefrei',
                'Aufzug',
                'Hotel'
            ]
        }
    ],
    maxRounds: 8,
    maxTokens: 4096,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Describe your situation: Where are you? What happened? What do you need?'
            }
        },
        required: ['query']
    }
}
