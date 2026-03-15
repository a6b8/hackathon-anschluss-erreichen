const content = `
## Step 1: Identify the Situation

Parse the user's input to extract:
- Current train (line name, e.g. RE1, ICE 577)
- Delay amount (e.g. 15 minutes)
- Transfer station (e.g. Berlin Hbf)
- Destination (e.g. Potsdam, Muenchen)

Use {{tool:searchLocations}} to resolve station names to IDs and coordinates.

## Step 2: Check Current Departures

Use {{tool:getDepartures}} at the transfer station with duration=60 to see upcoming departures.
Look for:
- The planned connection (line + direction matching destination)
- Planned departure time vs. estimated arrival with delay
- Is there enough transfer time? (typically 5-10 min needed)

If VBB area (Berlin/Brandenburg), also use {{tool:getDeparturesVbb}} for S-Bahn/U-Bahn/Bus data.

## Step 3: Evaluate Connection Feasibility

Calculate: arrival_time_with_delay + transfer_time vs. connection_departure_time

Three outcomes:
- **ERREICHBAR**: Transfer time sufficient even with delay → "Du schaffst es, aber beeil dich"
- **KNAPP**: Less than 3 minutes margin → "Wird knapp. Hier ist Plan B:"
- **VERPASST**: Connection already gone → "Leider verpasst. Hier sind deine Optionen:"

## Step 4: Find Alternatives

### Option A: Next scheduled train
Use {{tool:getDepartures}} or {{tool:planJourney}} with destination to find the next connection.
Show time, line, platform, and whether it's direct or with transfer.

### Option B: Local transport
Use {{tool:findStationMobility}} to find bus stops, tram stops near the transfer station.
Use {{tool:getDeparturesVbb}} if in Berlin/Brandenburg for real-time OEPNV departures.

### Option C: Sharing mobility
Use {{tool:getStationsAndBikes}} to check nextbike availability near the station.
Use {{tool:getFreeBikes}} to check Dott e-scooter availability.
Only recommend if destination is within 5km AND weather is suitable.

### Option D: Reachable destinations (VBB only)
Use {{tool:getReachableFrom}} with station coordinates to show what's reachable in 15-30 min by public transit.

## Step 5: Check Weather

Use {{tool:getCurrentWeather}} at the station location.
This influences recommendations:
- Rain or < 10°C → prioritize indoor transport (train, bus, taxi)
- Dry and warm → bike/scooter becomes a good option
- Include weather in the response: "Bei 14°C und Sonne ist nextbike eine gute Option"

## Step 6: Live Vehicle Positions (Berlin only)

If in Berlin/Brandenburg area:
Use {{tool:getRadar}} with a bounding box around the station to show real-time vehicle positions.
This helps the user SEE that alternatives are actually coming.

## Step 7: Compile Response

Present results in this order:
1. **Lage**: "Dein RE1 kommt um XX:XX an (statt XX:XX). Die S1 nach Potsdam faehrt um XX:XX."
2. **Ergebnis**: "Du hast X Minuten Umsteigezeit — das [reicht / wird knapp / reicht nicht]."
3. **Empfehlung**: The single best action.
4. **Alternativen**: 2-3 alternatives with times and details.
5. **Kontext**: Weather, accessibility notes, warnings.
`


export const skill = {
    name: 'connection-check',
    version: 'flowmcp-skill/1.0.0',
    description: 'Real-time connection feasibility check. Determines if a transfer is still reachable given a delay, and provides ranked alternatives including next trains, local transit, and sharing mobility.',
    requires: {
        tools: [
            'searchLocations',
            'getDepartures',
            'getArrivals',
            'planJourney',
            'getNearbyLocations',
            'getRadar',
            'getReachableFrom',
            'findStationMobility',
            'getCurrentWeather',
            'getStationsAndBikes',
            'getFreeBikes'
        ],
        resources: [],
        external: []
    },
    input: [
        {
            key: 'currentTrain',
            type: 'string',
            description: 'The train you are currently on or arriving with (e.g. "RE1", "ICE 577")',
            required: false
        },
        {
            key: 'delay',
            type: 'number',
            description: 'Current delay in minutes',
            required: false
        },
        {
            key: 'transferStation',
            type: 'string',
            description: 'Station where you need to transfer (e.g. "Berlin Hbf")',
            required: true
        },
        {
            key: 'destination',
            type: 'string',
            description: 'Your final destination (e.g. "Potsdam Hbf", "Muenchen")',
            required: true
        }
    ],
    output: 'German-language assessment: connection feasible (yes/tight/no), best recommendation, 2-3 ranked alternatives with times, weather context, sharing options.',
    content
}
