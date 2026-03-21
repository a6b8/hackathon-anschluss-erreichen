export const main = {
    namespace: 'transportrestdb',
    name: 'transport.rest DB',
    description: 'Access Deutsche Bahn (German Railway) data via the transport.rest API. Search stations, get real-time departures and arrivals, plan journeys across all DB services (ICE, IC, RE, RB, S-Bahn), and retrieve trip details. Free, no API key required.',
    version: '3.0.0',
    docs: ['https://v6.db.transport.rest/', 'https://github.com/public-transport/hafas-rest-api'],
    tags: ['transport', 'railway', 'germany', 'public-transit', 'timetable', 'cacheTtlFrequent'],
    root: 'https://v6.db.transport.rest',
    requiredServerParams: [],
    headers: {},
    tools: {
        searchLocations: {
            method: 'GET',
            path: '/locations',
            description: 'Search for stations and addresses by name. Returns matching locations with coordinates, product availability (ICE, IC, regional, S-Bahn, bus), and station weight (importance).',
            parameters: [
                { position: { key: 'query', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'results', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(10)'] } },
                { position: { key: 'fuzzy', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(true)'] } }
            ],
            tests: [
                { _description: 'Search for Berlin stations', query: 'Berlin', results: 5 },
                { _description: 'Search for Munich main station', query: 'München Hbf', results: 3 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, location: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } }, products: { type: 'object' }, weight: { type: 'number' } } } }
            }
        },
        getStop: {
            method: 'GET',
            path: '/stops/:stopId',
            description: 'Get detailed information about a specific stop/station by its IBNR ID including name, coordinates, available transport products, and connected lines.',
            parameters: [
                { position: { key: 'stopId', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } }
            ],
            tests: [
                { _description: 'Get Berlin Hbf station details', stopId: '8011160' },
                { _description: 'Get Hamburg Hbf station details', stopId: '8002549' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, location: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } }, products: { type: 'object' }, weight: { type: 'number' } } }
            }
        },
        getDepartures: {
            method: 'GET',
            path: '/stops/:stopId/departures',
            description: 'Get real-time departures from a station. Returns scheduled and real-time departure times, platform, line name, direction, and delay information for all transport modes.',
            parameters: [
                { position: { key: 'stopId', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'duration', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(30)'] } },
                { position: { key: 'results', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(10)'] } }
            ],
            tests: [
                { _description: 'Get departures from Berlin Hbf', stopId: '8011160', results: 5 },
                { _description: 'Get departures from Frankfurt Hbf', stopId: '8000105', duration: 60, results: 5 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { departures: { type: 'array', items: { type: 'object', properties: { tripId: { type: 'string' }, stop: { type: 'object' }, when: { type: 'string' }, plannedWhen: { type: 'string' }, delay: { type: 'number' }, platform: { type: 'string' }, direction: { type: 'string' }, line: { type: 'object', properties: { name: { type: 'string' }, mode: { type: 'string' }, product: { type: 'string' } } } } } } } }
            }
        },
        getArrivals: {
            method: 'GET',
            path: '/stops/:stopId/arrivals',
            description: 'Get real-time arrivals at a station. Returns scheduled and actual arrival times, origin, platform, delay, and line information.',
            parameters: [
                { position: { key: 'stopId', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'duration', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(30)'] } },
                { position: { key: 'results', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(10)'] } }
            ],
            tests: [
                { _description: 'Get arrivals at Berlin Hbf', stopId: '8011160', results: 5 },
                { _description: 'Get arrivals at Potsdam Hbf', stopId: '8012666', results: 5 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { arrivals: { type: 'array', items: { type: 'object', properties: { tripId: { type: 'string' }, stop: { type: 'object' }, when: { type: 'string' }, plannedWhen: { type: 'string' }, delay: { type: 'number' }, platform: { type: 'string' }, provenance: { type: 'string' }, line: { type: 'object', properties: { name: { type: 'string' }, mode: { type: 'string' }, product: { type: 'string' } } } } } } } }
            }
        },
        planJourney: {
            method: 'GET',
            path: '/journeys',
            description: 'Plan a journey between two stations. IMPORTANT: from and to MUST be IBNR station IDs (e.g. 8000191 for Karlsruhe Hbf, 8011160 for Berlin Hbf). Use searchStations first to get the IBNR. Do NOT pass city names. Set tickets=true for prices.',
            parameters: [
                { position: { key: 'from', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'to', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'results', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(3)'] } },
                { position: { key: 'transfers', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'tickets', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(false)'] } },
                { position: { key: 'bestprice', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(false)'] } },
                { position: { key: 'firstClass', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(false)'] } },
                { position: { key: 'loyaltyCard', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Plan journey Berlin to Hamburg with prices', from: '8011160', to: '8002549', results: 2, tickets: true },
                { _description: 'Find cheapest Berlin to Potsdam', from: '8011160', to: '8012666', bestprice: true, results: 3 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { journeys: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, legs: { type: 'array', items: { type: 'object', properties: { origin: { type: 'object' }, destination: { type: 'object' }, departure: { type: 'string' }, arrival: { type: 'string' }, line: { type: 'object' }, direction: { type: 'string' } } } } } } } } }
            }
        },
        getNearbyLocations: {
            method: 'GET',
            path: '/locations/nearby',
            description: 'Find stops and stations near geographic coordinates. Returns nearby locations sorted by walking distance in meters.',
            parameters: [
                { position: { key: 'latitude', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'longitude', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'results', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(8)'] } },
                { position: { key: 'distance', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Find stops near Berlin Hbf', latitude: 52.525607, longitude: 13.369072, results: 5 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, distance: { type: 'number' }, location: { type: 'object' } } } }
            }
        },
        searchStations: {
            method: 'GET',
            path: '/stations',
            description: 'Autocomplete DB station names using the db-stations dataset. Returns richer data than /locations including address, operator, category, and facilities.',
            parameters: [
                { position: { key: 'query', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'limit', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(3)'] } },
                { position: { key: 'fuzzy', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(false)'] } },
                { position: { key: 'completion', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(true)'] } }
            ],
            tests: [
                { _description: 'Search Berlin stations', query: 'Berlin', limit: 5 },
                { _description: 'Fuzzy search Potsdm', query: 'Potsdm', fuzzy: true, limit: 3 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object' }
            }
        },
        getTrip: {
            method: 'GET',
            path: '/trips/:tripId',
            description: 'Get detailed information about a specific trip including all stops, arrival/departure times, delays, and current position. Use tripId from departures or journey results.',
            parameters: [
                { position: { key: 'tripId', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } }
            ],
            tests: [
                { _description: 'Get trip details (use tripId from departures)' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { trip: { type: 'object', properties: { id: { type: 'string' }, line: { type: 'object' }, direction: { type: 'string' }, origin: { type: 'object' }, destination: { type: 'object' }, departure: { type: 'string' }, arrival: { type: 'string' }, stopovers: { type: 'array' } } } } }
            }
        }
    }
}
