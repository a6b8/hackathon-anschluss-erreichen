const content = `
## Step 1: Classify the Query

Analyze the user's input to determine which module to activate:

| Keywords | Module | Action |
|----------|--------|--------|
| guenstig, Preis, Sparpreis, kostet, buchen, Ticket | Ticketkauf | Compare DB and FlixBus prices |
| Verspaetung, Anschluss, schaffe ich, verpasst, umsteigen | Anschluss-Navigator | Check connection feasibility |
| gestrandet, Toilette, Hotel, ausgefallen, 23 Uhr, Nacht | Bahnhofs-Ueberleben | Find basic needs + accommodation |
| wie komme ich, kenne nicht, Innenstadt, fremd, Orientierung | Stadt-Navigator | Local transport + POIs |
| Fahrrad, Rad, abstellen, parken, Bike | Radparken | Find bike parking |

If multiple keywords match: prioritize by urgency.
Stranding > Delay > Navigation > Parking > Price.

## Step 2: Establish Location

For ALL modules, first resolve the station:
Use {{tool:searchLocations}} with the mentioned station name.
Extract: station ID, latitude, longitude.

## Step 3: Execute Module

### If Ticketkauf:
1. {{tool:planJourney}} with tickets=true, bestprice=true
2. {{tool:searchTrips}} for FlixBus alternative
3. Present price comparison table

### If Anschluss-Navigator:
1. {{tool:getDepartures}} at transfer station
2. {{tool:getRadar}} if Berlin area (live positions)
3. {{tool:getReachableFrom}} for alternatives
4. {{tool:findStationMobility}} for bus/taxi/sharing
5. {{tool:getCurrentWeather}} for outdoor options

### If Bahnhofs-Ueberleben:
1. {{tool:getCurrentWeather}} — urgency assessment
2. {{tool:findStationAmenities}} — toilet, food, warmth (OPEN NOW filter)
3. {{tool:findAccommodation}} — hotels if needed
4. {{tool:getDepartures}} with duration=720 — next trains
5. {{tool:findStationMobility}} — taxi, bus

### If Stadt-Navigator:
1. {{tool:forwardGeocode}} — locate destination
2. {{tool:planJourney}} — route via public transit
3. {{tool:findStationMobility}} — local transport options
4. {{tool:getFreeBikes}} / {{tool:getStationsAndBikes}} — sharing

### If Radparken:
1. {{tool:findBikeInfrastructure}} — OSM bike parking data
2. {{tool:getStationsAndBikes}} — nextbike alternative
3. {{tool:getFreeBikes}} — Dott e-scooter alternative
4. {{tool:getCurrentWeather}} — covered parking if rain

## Step 4: Enrich with Context

For every response, consider adding:
- Weather (already queried) — affects outdoor recommendations
- Time of day — affects what's open
- Accessibility — if user mentions wheelchair/luggage
`


export const skill = {
    name: 'route-query',
    version: 'flowmcp-skill/1.0.0',
    description: 'Master routing skill that classifies mobility queries and dispatches to the appropriate module (ticketkauf, anschluss, survival, navigation, bike parking).',
    requires: {
        tools: [
            'searchLocations', 'getDepartures', 'getArrivals', 'planJourney',
            'getNearbyLocations', 'getRadar', 'getReachableFrom',
            'findStationAmenities', 'findStationMobility', 'findAccommodation',
            'findAccessibility', 'findBikeInfrastructure',
            'forwardGeocode', 'getCurrentWeather',
            'getStationsAndBikes', 'getFreeBikes',
            'searchTrips', 'autocompleteCities', 'getAllProjects'
        ],
        resources: [],
        external: []
    },
    input: [
        { key: 'query', type: 'string', description: 'Any mobility-related question in German or English', required: true }
    ],
    output: 'Module-specific response: price table, connection assessment, survival guide, city orientation, or bike parking options.',
    content
}
