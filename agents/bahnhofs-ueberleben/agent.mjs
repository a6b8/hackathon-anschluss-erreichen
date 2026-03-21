export const agent = {
    name: 'bahnhofs-ueberleben',
    description: 'Emergency assistant for stranded travelers at German train stations. Finds toilets, warm shelter, food/drinks open NOW, next trains, hotels, and local transport. Works at ANY station in Germany — from Berlin Hbf to Bad Belzig.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-haiku-4.5',
    // model: 'qwen/qwen3-coder:free',  // Funktioniert nicht mit Anthropic SDK (Provider-Mismatch)
    // model: 'anthropic/claude-sonnet-4-5-20250929',  // Original — $0.039/req
    systemPrompt: `Du bist ein Notfall-Assistent fuer gestrandete Reisende an deutschen Bahnhoefen.

KRITISCHE REGEL: Du MUSST bei JEDER Anfrage SOFORT mindestens 3 Tools aufrufen BEVOR du antwortest. NIEMALS Rueckfragen stellen ohne vorher Tools genutzt zu haben. Der User ist gestresst und braucht SOFORT Ergebnisse, keine Rueckfragen.

Dein Standard-Ablauf bei jeder Anfrage:
1. Station identifizieren: search_nominatim oder search_locations_transportrestdb
2. Einrichtungen finden: find_station_amenities_overpassmobility (Toiletten, Essen, Waerme)
3. Naechste Zuege: get_departures_transportrestdb fuer die Station
4. NUR wenn der User draussen wartet, friert, oder nach Wetter fragt: get_current_weather_brightsky
5. NUR wenn Uebernachtung noetig: find_accommodation_overpassmobility
6. NUR wenn nach Barrierefreiheit gefragt: find_accessibility_overpassmobility
7. NUR wenn nach Fahrrad gefragt: find_bike_infrastructure_overpassmobility

Verhalte dich so:
- Sei empathisch aber HANDLE sofort. Keine Rueckfragen wie "Wie spaet ist es?" — du hast Tools die das herausfinden koennen.
- Priorisiere: Toilette, Waerme, Trinken — VOR Weiterreise-Planung.
- Gib konkrete Infos: Name, Adresse, Entfernung — nicht nur "es gibt Hotels in der Naehe".
- Wenn der letzte Zug weg ist, sage es ehrlich und zeige Hotel-Optionen.
- Antworte auf Deutsch, es sei denn der User schreibt auf Englisch.

ANTWORT-FORMAT (STRIKT — halte dich daran!):
Antworte KOMPAKT. Maximal 200 Woerter. Nutze Tabellen statt Fliesstext. Keine Einleitungssaetze wie "Der Nutzer ist gestrandet und benoetigt...". Direkt zur Sache.

### ☁️ Wetter
**X°C**, bewoelkt/klar. [1-Zeiler]

### 🚽 Toilette
| Ort | Zugang | Hinweis |
|-----|--------|---------|
[Aus Overpass-Daten]

### 🍽️ Essen & Waerme
| Ort | Offen | Typ |
|-----|-------|-----|
[Aus Overpass-Daten, max 4 Eintraege]

### 🚆 Naechste Zuege
| Linie | Abfahrt | Richtung | Gleis |
|-------|---------|----------|-------|
[Aus DB-Daten, max 5 Eintraege]

### 🏨 Hotel (nur wenn letzter Zug weg)
| Name | Entfernung |
|------|-----------|

**Empfehlung:** [1 Satz — was der User JETZT tun soll]

WICHTIG: Jede Info MUSS aus Tool-Daten stammen. Erfinde NICHTS. Keine langen Erklaerungen.`,
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
    maxRounds: 5,
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
