const content = `
## Step 1: Locate Station

Use {{tool:searchLocations}} or {{tool:forwardGeocode}} to get station coordinates.

## Step 2: Find Bike Infrastructure

Use {{tool:findBikeInfrastructure}} with station coordinates and radius 500m.
From the OSM results, categorize each element:

**Bike Parking** (amenity=bicycle_parking):
- bicycle_parking type: stands, lockers, wall_loops, two-tier, shed, bollard
- capacity: number of bikes
- covered: yes/no
- access: public/private/customers
- fee: yes/no
- operator: who manages it
- lit: yes/no (important for safety at night)

**Bike Rental** (amenity=bicycle_rental):
- name, operator, capacity
- Opening hours

**Bike Repair** (amenity=bicycle_repair_station):
- Tools available, location

**Bike Shops** (shop=bicycle):
- Name, address, opening hours

## Step 3: Check Sharing Alternatives

Use {{tool:getStationsAndBikes}} (nextbike) with the city ID to check bike sharing.
Use {{tool:getFreeBikes}} (Dott) for e-scooter/e-bike availability.
These are alternatives when:
- No secure parking available
- User doesn't want to leave their bike overnight
- Short commute (sharing more practical than own bike)

## Step 4: Check Planned Infrastructure (Berlin only)

Use {{tool:getAllProjects}} from infraVelo.
Filter for projects near the station coordinates.
Show: "Geplant: Neues Fahrradparkhaus am [Station], Fertigstellung [Datum]"

## Step 5: Weather Context

Use {{tool:getCurrentWeather}} to inform recommendations:
- Rain → "Bei Regen sind die ueberdachten Stellplaetze an Ausgang Nord empfehlenswert"
- Cold → "Im Winter sind Schliessfaecher sicherer (Sattel/Griffe vereisen nicht)"

## Step 6: Compile Recommendation

Sort parking options by quality:
1. Schliessfaecher/Boxen (sicherst, oft kostenpflichtig)
2. Ueberdachte Buegel (gut fuer Pendler)
3. Offene Buegel (Standard, kostenlos)
4. Freies Abstellen (unsicher, nicht empfohlen)

Present: Total capacity, best options with details, sharing alternatives.
`


export const skill = {
    name: 'find-bike-parking',
    version: 'flowmcp-skill/1.0.0',
    description: 'Find and evaluate bike parking at any German train station. Categorizes by security level (lockers > covered > open), shows capacity, and offers sharing alternatives.',
    requires: {
        tools: [ 'searchLocations', 'forwardGeocode', 'findBikeInfrastructure', 'getStationsAndBikes', 'getFreeBikes', 'getAllProjects', 'getCurrentWeather' ],
        resources: [],
        external: []
    },
    input: [
        { key: 'station', type: 'string', description: 'Station name (e.g. "Berlin Hbf", "Jannowitzbruecke")', required: true },
        { key: 'needs', type: 'string', description: 'Special needs: "ueberdacht", "schliessfach", "ueber Nacht"', required: false }
    ],
    output: 'Ranked list of bike parking options with capacity/type/covered/fee, sharing alternatives, planned infrastructure, weather-aware recommendation.',
    content
}
