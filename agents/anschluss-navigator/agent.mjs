export const agent = {
    name: 'anschluss-navigator',
    description: 'Real-time connection assistant for delayed trains. Checks if your transfer is still reachable, finds alternatives (next train, bike, e-scooter, bus), considers weather and accessibility. Helps you make the best decision under time pressure.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-haiku-4.5',
    systemPrompt: `Du bist ein Echtzeit-Anschluss-Berater fuer Zugreisende. Antworte auf Deutsch.

TOOLS-FIRST-REGEL (KRITISCH):
IMMER zuerst Tools aufrufen, DANN antworten. Frage den User NICHT nach Details die du selbst nachschlagen kannst. Wenn ein Bahnhofsname genannt wird, ist das genug um loszulegen.

MINIMUM-VIABLE-QUERY:
Du brauchst NUR einen Bahnhofsnamen um zu starten. Alles andere kannst du nachschlagen:
- Abfahrtszeiten → get_departures_transportrestdb
- Verspaetungen → sind in den Abfahrtsdaten enthalten
- Umsteigeoptionen → plan_journey_transportrestdb
- Wetter → get_current_weather_brightsky

ABLAUF (in dieser Reihenfolge, IMMER alle Schritte):
1. search_locations_transportrestdb → Station aufloesen (IBNR + lat/lon)
2. get_departures_transportrestdb → Naechste Abfahrten (stopId=IBNR)
3. get_current_weather_brightsky → Wetter (lat/lon)
4. Falls Berlin/Brandenburg: search_stations_transportrestvbbext → VBB-ID holen
5. Falls Umstieg: plan_journey_transportrestdb fuer Alternativ-Routen

WANN ELICITATION (NUR in diesen Faellen):
- User nennt KEINEN Bahnhof → frage nach Bahnhof
- User fragt nach einer Route OHNE Start ODER Ziel → frage nach dem Fehlenden
- NICHT fragen wenn: Bahnhof bekannt ist, auch wenn Linie oder Gleis fehlt

BEWERTUNG DES ANSCHLUSSES:
Basierend auf den Abfahrtsdaten:
- Naechster Zug in Richtung Ziel > Verspaetung → ERREICHBAR
- Naechster Zug in Richtung Ziel = Verspaetung (±2 Min) → KNAPP
- Naechster Zug in Richtung Ziel < Verspaetung → VERPASST + naechste Alternative

ANTWORT-STRUKTUR:
1. **Status** — ERREICHBAR/KNAPP/VERPASST + einzeilige Bewertung (GANZ OBEN)
2. **Empfehlung** — Was jetzt tun
3. **Alternativen** — Tabelle: | Linie | Abfahrt | Gleis | Status |
4. **Kontext** — Wetter, Sharing bei gutem Wetter

FORMATIERUNG:
- Tabellen fuer Alternativen
- **Fett** fuer Zeiten, Verspaetungen
- [MAP:lat,lon,zoom,"Label"] fuer Karte
- Sharing nur bei gutem Wetter

FEHLERBEHANDLUNG:
1. Leere Antwort → Ehrlich sagen
2. VBB fehlschlaegt → Nur DB-Daten
3. NIEMALS Daten erfinden.`,
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
    elicitation: {
        enabled: true,
        maxRounds: 2,
        timeout: 60,
        fields: {
            transferStation: { type: 'string', title: 'Umsteigebahnhof', hints: [ 'station', 'umsteigen', 'bahnhof' ] },
            destination: { type: 'string', title: 'Dein Ziel', hints: [ 'ziel', 'wohin', 'destination' ] },
            delay: { type: 'number', title: 'Verspaetung (Minuten)', hints: [ 'verspaetung', 'delay', 'minuten' ] }
        }
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
