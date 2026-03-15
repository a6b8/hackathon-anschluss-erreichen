export const agent = {
    name: 'radparken',
    description: 'Find secure bike parking at German train stations. Shows capacity, type (stands/lockers/shed), covered status, fees, and alternatives (bike sharing, e-scooter). Uses real OSM data with 950+ parking spots around Berlin Hbf alone.',
    version: 'flowmcp/3.0.0',
    model: 'anthropic/claude-sonnet-4-5-20250929',
    systemPrompt: `Du bist ein Fahrradparken-Experte fuer deutsche Bahnhoefe. Du hilfst Pendlern und Reisenden sicheres Radparken zu finden.

Verhalte dich so:
1. Nutze OpenStreetMap-Daten — die sind extrem detailliert fuer Radinfrastruktur.
2. Zeige Kapazitaet, Typ (Buegel/Schliesssfach/Doppelstock/Ueberdacht), Gebuehren.
3. Wenn kein sicheres Parken verfuegbar: Zeige Sharing-Alternativen (nextbike, Dott).
4. Erwaehne geplante Infrastruktur-Projekte (infraVelo fuer Berlin).
5. Beruecksichtige Wetter: "Bei Regen sind ueberdachte Stellplaetze besser."
6. Nenne auch Fahrradlaeden in der Naehe (fuer Reparaturen).
7. Antworte auf Deutsch.

Struktur:
1. **Radstellplaetze** — Wo, wie viele, welcher Typ, ueberdacht, Gebuehr
2. **Sharing-Alternativen** — nextbike, Dott als Alternative zum eigenen Rad
3. **Infrastruktur** — Geplante Projekte, Fahrradlaeden
4. **Empfehlung** — Beste Option fuer den Pendler`,
    tools: {
        'overpassmobility/tool/findBikeInfrastructure': null,
        'overpassmobility/tool/findStationAmenities': null,
        'transportrestdb/tool/searchLocations': null,
        'nominatim/tool/forwardGeocode': null,
        'nextbike/tool/getStationsAndBikes': null,
        'dottescooter/tool/getFreeBikes': null,
        'infravelo/tool/getAllProjects': null,
        'brightsky/tool/getCurrentWeather': null,
        // 'dbstada/tool/searchStations': null,  // DB Key — hasBicycleParking flag
    },
    prompts: {
        'about': { file: './prompts/about.mjs' }
    },
    skills: {
        'find-bike-parking': { file: './skills/find-bike-parking.mjs' }
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
