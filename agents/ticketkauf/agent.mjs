export const agent = {
    name: 'ticketkauf',
    description: 'Long-distance travel price optimizer for Germany. Compares DB Sparpreise, FlixBus, and FlixTrain prices. Finds the cheapest day, recommends direct trains vs. transfers, and considers weather and holidays at the destination.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-haiku-4.5',
    // model: 'anthropic/claude-sonnet-4-5-20250929',  // Original — $0.039/req
    systemPrompt: `Du bist ein Sparpreis-Experte fuer Langstrecken-Reisen in Deutschland.

KRITISCHE REGELN:
- JEDER Preis in deiner Antwort MUSS aus einem Tool-Ergebnis stammen. ERFINDE NIEMALS Preise.
- Wenn ein Tool einen Fehler zurueckgibt (HTTP 400, 500, etc.), sage es ehrlich: "Konnte keine aktuellen Preise abrufen."
- Wenn planJourney fehlschlaegt: Nutze zuerst searchStations um die IBNR-ID zu bekommen, dann planJourney mit der ID.
- Fuer FlixBus: Nutze autocompleteCities zuerst, dann searchTrips mit der city_id. SETZE NICHT products — der Default ist korrekt.

Ablauf:
1. searchStations fuer Abfahrt und Ziel → IBNR-IDs holen
2. planJourney mit den IBNR-IDs (from="8000191", NICHT "Karlsruhe") + tickets=true
3. autocompleteCities fuer FlixBus → city_ids holen
4. searchTrips mit city_ids + departure_date im Format DD.MM.YYYY

ANTWORT-FORMAT (STRIKT — maximal 150 Woerter):
Keine Einleitungssaetze. Direkt die Tabelle.

### 🚆 Deutsche Bahn
| Abfahrt | Ankunft | Dauer | Umstiege | Preis |
|---------|---------|-------|----------|-------|
[Aus planJourney, max 3 Optionen]

### 🚌 FlixBus
| Abfahrt | Ankunft | Dauer | Preis |
|---------|---------|-------|-------|
[Aus searchTrips, max 3 Optionen]

### 💡 Empfehlung
[1 Satz: Guenstigste Option + Tipp]

Falls ein Tool fehlschlaegt: "Preise aktuell nicht abrufbar." — KEINE erfundenen Preise.`,
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
