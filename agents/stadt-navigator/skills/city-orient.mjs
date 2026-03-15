const content = `
## Step 1: Establish Location

Use {{tool:forwardGeocode}} with the station name to get exact coordinates.
Use {{tool:searchLocations}} to get the DB station ID.
Briefly describe the location: "Du bist am Leipzig Hauptbahnhof, im Zentrum der Stadt."

## Step 2: Route to Destination

If user has a specific destination:
Use {{tool:planJourney}} (DB) or {{tool:planTrip}} (VRR EFA for local transit) to find the best route.
Show: departure time, line, direction, arrival time, number of transfers.

If user has no specific destination (just arrived):
Use {{tool:findStationMobility}} to show what transport is available right at the station.
List: bus lines, tram stops, U-Bahn entrances, taxi stands.

## Step 3: Sharing Alternatives

Use {{tool:getFreeBikes}} (Dott) and {{tool:getStationsAndBikes}} (nextbike) to check sharing availability.
Only recommend if:
- Destination is within ~5km
- Weather is suitable (check context from user)
- User seems mobile (no heavy luggage mentioned)

## Step 4: Nearby Amenities

Use {{tool:findStationAmenities}} with station coordinates.
Show what's immediately available:
- Food/drink options near the station
- Supermarket/convenience stores
- ATM/bank
- Tourist information

## Step 5: Compile City Guide

Present as a mini city guide:
1. **Wo du bist**: Station name, brief city context
2. **Route**: Step-by-step to destination (if provided)
3. **Alternativen**: E-Scooter, Rad, Taxi with availability
4. **In der Naehe**: Top 3-5 amenities within walking distance
`


export const skill = {
    name: 'city-orient',
    version: 'flowmcp-skill/1.0.0',
    description: 'Help travelers orient themselves in an unfamiliar city from a train station. Provides OEPNV routing, sharing options, and nearby amenities.',
    requires: {
        tools: [ 'forwardGeocode', 'searchLocations', 'planJourney', 'getDepartures', 'findStationMobility', 'findStationAmenities', 'getFreeBikes', 'getStationsAndBikes' ],
        resources: [],
        external: []
    },
    input: [
        { key: 'station', type: 'string', description: 'Station name where you are', required: true },
        { key: 'destination', type: 'string', description: 'Where you want to go (address, POI, or area)', required: false }
    ],
    output: 'City orientation guide: location context, OEPNV route to destination, sharing alternatives, nearby amenities.',
    content
}
