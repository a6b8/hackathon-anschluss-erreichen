const content = `
## Step 1: Resolve Locations

Use {{tool:searchLocations}} to resolve start and destination to station IDs.
For FlixBus, use {{tool:autocompleteCities}} to get the FlixBus city UUIDs.

## Step 2: Query DB Prices

Use {{tool:planJourney}} with:
- from: station ID, to: station ID
- tickets: true (to get price information)
- bestprice: true (to find cheapest across the day)
- results: 5

Extract from each journey:
- Departure time, arrival time, duration
- Number of transfers (0 = direct!)
- Price amount and currency
- Train type (ICE, IC, RE)

## Step 3: Query FlixBus Prices

Use {{tool:searchTrips}} with:
- from: FlixBus city UUID
- to: FlixBus city UUID
- departure_date: requested date

Extract:
- Departure time, arrival time, duration
- Price (usually cheaper than DB)
- Number of transfers
- Available seats

## Step 4: Check Weather at Destination

Use {{tool:getForecast}} for the destination coordinates and travel date.
Include in the recommendation:
- Temperature, precipitation chance
- "Pack einen Regenschirm ein" or "Sonnenbrillle nicht vergessen"

## Step 5: Build Comparison Table

Create a markdown table with ALL options sorted by price:

| Option | Preis | Dauer | Umstiege | Direkt? | Typ | Abfahrt |
|--------|-------|-------|----------|---------|-----|---------|

## Step 6: Make Recommendation

Evaluate based on:
1. Price (primary factor — user wants cheap)
2. Direct connection (huge advantage for long distance)
3. Duration (4h ICE vs 9h FlixBus matters)
4. Reliability (DB gives replacement if cancelled, FlixBus does not)

Format: "Empfehlung: [Option] — [Preis], [Dauer], [Begruendung]"
Also mention: "Achtung: FlixBus bietet bei Ausfall keinen Ersatz. DB erstattet/vermittelt."
`


export const skill = {
    name: 'price-compare',
    version: 'flowmcp-skill/1.0.0',
    description: 'Compare long-distance travel prices between DB (Sparpreis/Flexpreis) and FlixBus/FlixTrain. Presents a sorted price table with clear recommendation.',
    requires: {
        tools: [
            'searchLocations',
            'planJourney',
            'searchTrips',
            'autocompleteCities',
            'getForecast'
        ],
        resources: [],
        external: []
    },
    input: [
        { key: 'from', type: 'string', description: 'Start city or station', required: true },
        { key: 'to', type: 'string', description: 'Destination city or station', required: true },
        { key: 'date', type: 'string', description: 'Travel date (YYYY-MM-DD)', required: false }
    ],
    output: 'Price comparison table (DB vs FlixBus), recommendation with reasoning, weather at destination.',
    content
}
