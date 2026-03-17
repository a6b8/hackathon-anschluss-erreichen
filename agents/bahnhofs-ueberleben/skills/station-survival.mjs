const content = `
## Step 1: Locate the Station

Use {{tool:searchLocations}} with the station name from {{input:stationName}} to get the station ID and coordinates.
If the user provides a vague description ("irgendwo in Sachsen"), use {{tool:forwardGeocode}} to resolve the location first.
Extract latitude and longitude for all subsequent queries.

## Step 2: Check Weather Conditions

Use {{tool:getCurrentWeather}} with the station coordinates.
This determines urgency:
- Temperature below 10°C or rain → URGENT: prioritize warm indoor shelter
- Temperature below 0°C → CRITICAL: find 24/7 warm location immediately
- Warm and dry → less urgent, more options

## Step 3: Find Basic Needs (MOST IMPORTANT)

Use {{tool:findStationAmenities}} with station coordinates and radius 500m.
From the results, filter and categorize:

**Toilets:**
- Look for amenity=toilets nodes
- Check opening_hours tag — only include if open NOW
- Note: fee (yes/no), wheelchair access

**Warm Places (Cafes/Restaurants):**
- Look for amenity=restaurant, amenity=cafe, amenity=fast_food
- CRITICAL: Check opening_hours — filter for OPEN NOW
- Prioritize 24/7 locations (McDonald's, Burger King often 24h)
- Include name, address, distance from station

**Drinks/Snacks:**
- Look for shop=convenience, shop=kiosk, vending_machine
- Check opening_hours for shops
- Vending machines work 24/7

## Step 4: Find Next Trains

Use {{tool:getDepartures}} with the station ID from Step 1.
Set duration to 720 (12 hours) to catch early morning trains.
List the next 5 departures with:
- Time, line, direction, platform
- If delay information available, include it
- If NO departures in 12 hours, say so clearly

## Step 5: Find Local Transport Alternatives

Use {{tool:findStationMobility}} with station coordinates.
Categorize results:
- Bus stops (highway=bus_stop) — check for night bus services
- Taxi stands (amenity=taxi) — always available
- Bike sharing, e-scooter — if user is mobile
- Tram stops, subway entrances

## Step 6: Find Accommodation (if needed)

If the last train is gone or won't come for 6+ hours:
Use {{tool:findAccommodation}} with station coordinates and radius 2000m.
List hotels/hostels with:
- Name, address, phone number, website
- Distance from station
- Wheelchair accessible? (check wheelchair tag)
Sort by distance from station.

## Step 7: Accessibility Check (if relevant)

If user mentions wheelchair, mobility issues, stroller, or heavy luggage:
Use {{tool:findAccessibility}} with station coordinates.
Report:
- Elevator status and locations
- Wheelchair-accessible entrances
- Accessible toilets
- Audio signals at crossings

## Step 8: Compile Report

Structure the final response as:

### 1. Grundbeduerfnisse
- Toilette: [name, location, open hours, fee]
- Warm sitzen: [name, address, open until, distance]
- Trinken/Essen: [name, what's available, distance]

### 2. Weiterreise
- Naechster Zug: [time, line, direction, platform]
- Nachtbus/Tram: [line, richtung, takt]
- Taxi: [standort, telefonnummer]
- Sharing: [nextbike/Dott verfuegbar?]

### 3. Uebernachtung (only if trains 6+ hours away)
- Hotel 1: [name, address, phone, distance, wheelchair?]
- Hotel 2: [name, address, phone, distance]
- Hostel: [name, address, phone, distance]

### 4. Orientierung
- Stadt: [kurze Info]
- Aktuelle Temperatur: [X°C, Regen/trocken]
- Tipp: [e.g. "Der Wartesaal auf Gleis 1 ist beheizt und 24h offen"]
`


export const skill = {
    name: 'station-survival',
    version: 'flowmcp-skill/1.0.0',
    description: 'Step-by-step workflow to help stranded travelers at any German train station. Finds toilets, warm shelter, food/drinks open NOW, next trains, hotels, and local transport.',
    requires: {
        tools: [
            'searchLocations',
            'getDepartures',
            'getNearbyLocations',
            'forwardGeocode',
            'getCurrentWeather',
            'findStationAmenities',
            'findStationMobility',
            'findAccommodation',
            'findAccessibility'
        ],
        resources: [],
        external: []
    },
    input: [
        {
            key: 'stationName',
            type: 'string',
            description: 'Name of the train station where the user is stranded (e.g. "Leipzig Hbf", "Frankfurt Sued", "Goettingen")',
            required: true
        },
        {
            key: 'situation',
            type: 'string',
            description: 'Description of what happened (e.g. "Zug ausgefallen", "Anschluss verpasst", "Flixtrain rausgeworfen")',
            required: false
        },
        {
            key: 'accessibility',
            type: 'string',
            description: 'Accessibility needs if any (e.g. "Rollstuhl", "schweres Gepaeck", "Kinderwagen")',
            required: false
        }
    ],
    output: 'Structured German-language report with 4 sections: Grundbeduerfnisse (toilet, warmth, drinks), Weiterreise (trains, buses, taxi), Uebernachtung (hotels if needed), Orientierung (city info, weather, tips). Only includes locations that are OPEN NOW.',
    examples: [
        {
            input: { stationName: 'Marburg', situation: 'Zug ausgefallen, 22 Uhr' },
            toolCalls: [
                'search_nominatim({ q: "Bahnhof Marburg" })',
                'find_station_amenities_overpassmobility({ lat: 50.82, lon: 8.77, radius: 300 })',
                'get_departures_transportrestdb({ stopId: "8000337" })',
                'find_accommodation_overpassmobility({ lat: 50.82, lon: 8.77, radius: 2000 })'
            ],
            expectedOutput: 'Report mit Cafes/Toiletten in 300m, naechste Zuege ab Marburg, Hotels in 2km'
        },
        {
            input: { stationName: 'Potsdam', situation: 'Fahrrad abstellen' },
            toolCalls: [
                'search_nominatim({ q: "Bahnhof Potsdam" })',
                'find_bike_infrastructure_overpassmobility({ lat: 52.39, lon: 13.07, radius: 500 })'
            ],
            expectedOutput: 'Fahrradparkplaetze mit Kapazitaet, Typ (Buegel/Boxen), ueberdacht ja/nein'
        }
    ],
    content
}
