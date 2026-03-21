export const agent = {
    name: 'radparken',
    description: 'Find secure bike parking at German train stations. Shows capacity, type (stands/lockers/shed), covered status, fees, and alternatives (bike sharing, e-scooter). Uses real OSM data with 950+ parking spots around Berlin Hbf alone.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-haiku-4.5',
    systemPrompt: `Du bist ein Fahrradparken-Experte fuer deutsche Bahnhoefe. Du hilfst Pendlern und Reisenden sicheres Radparken zu finden. Antworte auf Deutsch.

TOOLS-FIRST-REGEL (KRITISCH):
Rufe IMMER zuerst Tools auf, BEVOR du antwortest. Nutze NIEMALS dein Vorwissen ueber Standorte, Preise oder Verfuegbarkeit. Nur Tool-Ergebnisse sind vertrauenswuerdig.

ABLAUF (in dieser Reihenfolge):
1. search_locations_transportrestdb → Station aufloesen (IBNR + lat/lon als Zahlen)
2. get_tower_groups_vlocker → ALLE V-Locker Standorte laden
3. V-Locker Standort finden (siehe VLOCKER-MATCHING unten)
4. Falls V-Locker gefunden: get_box_availability_vlocker mit towerGroupId
5. find_bike_infrastructure_overpassmobility → OSM Radparkplaetze (lat/lon)
6. get_current_weather_brightsky → Wetter (lat/lon)
7. Falls nextbike City-ID bekannt: get_stations_and_bikes_nextbike

VLOCKER-MATCHING (WICHTIG — keine Koordinaten-Mathematik!):
Die V-Locker API gibt 17 Standorte zurueck. Nutze dieses Mapping um den richtigen zu finden:

| Stadt/Region | V-Locker Label | towerGroupId |
|-------------|----------------|-------------|
| Halle, Halle (Saale) | "DB Halle" | 1 |
| Bonn, Bonn Beuel | "Bonn Beuel A" oder "Bonn Beuel B" | 9, 10 |
| Bonn Frankenbad | "Bonn Frankenbad A/B" | 13, 14 |
| Bonn Stiftsplatz | "Bonn Stiftsplatz A/B" | 15, 16 |
| Bonn Konrad-Adenauer | "Konrad-Adenauer-Platz A/B" | 11, 12 |
| Muehlacker | "Muehlacker A/B" | 7, 8 |
| Treysa | "Treysa" | 17 |

Falls der Stadtname in der User-Anfrage mit einem Label oben uebereinstimmt → V-Locker GEFUNDEN.
Falls KEIN Match: "Kein V-Locker an diesem Bahnhof." + Overpass-Alternativen zeigen.

ACHTUNG: Berlin, Potsdam, Brandenburg, Muenchen, Hamburg, Frankfurt haben KEINEN V-Locker!

nextbike City-IDs: Berlin=362, Potsdam=158, Halle=943
Falls Stadt nicht in der Liste: nextbike-Schritt ueberspringen.

ANTWORT-STRUKTUR:
1. **V-Locker** — Verfuegbarkeit, Preis, Typ (oder "nicht verfuegbar")
2. **Radstellplaetze** — OSM-Daten: Typ, Kapazitaet, ueberdacht
3. **Sharing** — nextbike, Alternativen
4. **Empfehlung** — Beste Option

FORMATIERUNG:
- Tabellen fuer Vergleiche: | Option | Typ | Frei | Ueberdacht | Gebuehr |
- **Fett** fuer Zeiten, Preise, Status
- Status: OK / WARNUNG / PROBLEM
- Karte: [MAP:lat,lon,zoom,"Label"] fuer Kartenanzeige. Mehrere Marker moeglich.

FEHLERBEHANDLUNG:
1. V-Locker kein Match → Fallback: overpassmobility/findBikeInfrastructure
2. NIEMALS Daten erfinden. Nur Tool-Ergebnisse verwenden.`,
    tools: {
        'overpassmobility/tool/findBikeInfrastructure': null,
        'overpassmobility/tool/findStationAmenities': null,
        'transportrestdb/tool/searchLocations': null,
        'nominatim/tool/forwardGeocode': null,
        'nextbike/tool/getStationsAndBikes': null,
        'dottescooter/tool/getFreeBikes': null,
        'infravelo/tool/getAllProjects': null,
        'brightsky/tool/getCurrentWeather': null,
        'vlocker/tool/getTowerGroups': null,
        'vlocker/tool/getBoxAvailability': null,
        'vlocker/tool/getTowerWishes': null,
        // 'dbstada/tool/searchStations': null,  // DB Key — hasBicycleParking flag
    },
    elicitation: {
        enabled: true,
        maxRounds: 2,
        timeout: 60,
        fields: {
            station: { type: 'string', title: 'An welchem Bahnhof?', hints: [ 'station', 'bahnhof', 'ort' ] },
            boxType: { type: 'string', enum: [ 'REGULAR', 'CHARGER', 'egal' ], enumNames: [ 'Normal', 'Mit Ladestation', 'Egal' ], title: 'Welcher Box-Typ?' }
        }
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'find-bike-parking': { file: './skills/find-bike-parking.mjs' },
        'vlocker-check': { file: './skills/vlocker-check.mjs' }
    },
    tests: [
        {
            _description: 'Bike parking at Berlin Hbf',
            input: 'Wo kann ich mein Fahrrad sicher am Berlin Hauptbahnhof abstellen?',
            expectedTools: [
                'transportrestdb/tool/searchLocations',
                'overpassmobility/tool/findBikeInfrastructure'
            ],
            expectedContent: [ 'Stellplaetze', 'Kapazitaet' ]
        },
        {
            _description: 'Covered parking in rain',
            input: 'Es regnet, brauche ueberdachtes Radparken am Jannowitzbruecke',
            expectedTools: [
                'overpassmobility/tool/findBikeInfrastructure',
                'brightsky/tool/getCurrentWeather'
            ],
            expectedContent: [ 'ueberdacht', 'Regen' ]
        },
        {
            _description: 'No parking available — show alternatives',
            input: 'Gibt es Radparken am Bahnhof Bad Belzig? Oder Alternativen?',
            expectedTools: [
                'overpassmobility/tool/findBikeInfrastructure',
                'nextbike/tool/getStationsAndBikes'
            ],
            expectedContent: [ 'Bad Belzig', 'Alternative' ]
        }
    ],
    maxRounds: 5,
    maxTokens: 4096,
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Which station? Do you need covered/secure parking? Any special needs?'
            }
        },
        required: ['query']
    }
}
