export const agent = {
    name: 'ticketkauf',
    description: 'Long-distance travel price optimizer for Germany. Compares DB Sparpreise, FlixBus, and FlixTrain prices. Finds the cheapest day, recommends direct trains vs. transfers, and considers weather and holidays at the destination.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: `Du bist ein Sparpreis-Experte fuer Langstrecken-Reisen in Deutschland. Dein Ziel: Die guenstigste Verbindung finden.

Verhalte dich so:
1. Vergleiche IMMER Bahn und FlixBus/FlixTrain — der User will den besten Deal.
2. Priorisiere Direktzuege: Umsteigen bei langen Strecken ist riskant (Verspaetungen, Anschluesse).
3. Zeige Preise klar: Sparpreis vs. Flexpreis. Der Unterschied kann 100€+ sein.
4. Beruecksichtige Feiertage: Freitag vor Feiertag = teurer. Dienstag/Mittwoch = guenstiger.
5. Erwaehne FlixBus-Risiken ehrlich: Guenstiger, aber bei Ausfall steht man im Regen (kein Ersatz).
6. Bei bestprice=true werden Tagespreise verglichen — zeige den guenstigsten Tag.
7. Antworte auf Deutsch mit einer klaren Preisvergleichs-Tabelle.

Struktur:
1. **Preisvergleich** — Tabelle mit allen Optionen
2. **Empfehlung** — Die beste Option mit Begruendung
3. **Kontext** — Wetter am Ziel, Feiertage, Reisetipps`,
    tools: {
        'transportrestdb/tool/planJourney': null,
        'transportrestdb/tool/searchLocations': null,
        'flixbus/tool/searchTrips': null,
        'flixbus/tool/autocompleteCities': null,
        'brightsky/tool/getForecast': null,
        'nominatim/tool/forwardGeocode': null,
        // 'feiertage/tool/getHolidays': null,  // Enable when connected
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'price-compare': { file: './skills/price-compare.mjs' }
    },
    tests: [
        {
            _description: 'Berlin to Freiburg cheapest option',
            input: 'Was kostet ein Ticket von Berlin nach Freiburg naechste Woche? Moeglichst guenstig.',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'transportrestdb/tool/planJourney',
                'flixbus/tool/searchTrips'
            ],
            expectedContent: [
                'Sparpreis',
                'FlixBus',
                'Empfehlung'
            ]
        },
        {
            _description: 'Direct train preference',
            input: 'ICE Direktverbindung Berlin Muenchen, was kostet das am Dienstag?',
            expectedTools: [
                'transportrestdb/tool/planJourney'
            ],
            expectedContent: [
                'Direkt',
                'ICE'
            ]
        },
        {
            _description: 'Best price across days',
            input: 'Wann ist der guenstigste Tag um von Hamburg nach Stuttgart zu fahren?',
            expectedTools: [
                'transportrestdb/tool/planJourney',
                'flixbus/tool/searchTrips'
            ],
            expectedContent: [
                'guenstigste'
            ]
        }
    ],
    maxRounds: 5,
    maxTokens: 4096,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Where do you want to travel? When? Any preferences (direct, cheap, fast)?'
            }
        },
        required: ['query']
    }
}
