export const main = {
    namespace: 'transportrestvbbext',
    name: 'transport.rest VBB Extended',
    description: 'Extended Berlin-Brandenburg transit tools: nearby stops, trip search, line info, route shapes, station autocomplete, and journey refresh. Complements the core VBB schema. Free, no API key required.',
    version: '3.0.0',
    docs: ['https://v6.vbb.transport.rest/', 'https://github.com/public-transport/hafas-rest-api'],
    tags: ['transport', 'public-transit', 'berlin', 'germany', 'timetable', 'cacheTtlFrequent'],
    root: 'https://v6.vbb.transport.rest',
    requiredServerParams: [],
    headers: {},
    tools: {
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
                schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, distance: { type: 'number' }, location: { type: 'object' } } } }
            }
        },
        getTrip: {
            method: 'GET',
            path: '/trips/:id',
            description: 'Get detailed trip information including all stopovers, times, delays, and current position. Use tripId from departures or journey results.',
            parameters: [
                { position: { key: 'id', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'stopovers', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(true)'] } }
            ],
            tests: [
                { _description: 'Get trip details (use tripId from departures)' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { trip: { type: 'object', properties: { id: { type: 'string' }, line: { type: 'object' }, stopovers: { type: 'array' } } } } }
            }
        },
        searchTrips: {
            method: 'GET',
            path: '/trips',
            description: 'Search for currently running trips by line name, operator, or stop. Returns active vehicles with real-time positions and stopovers. VBB-exclusive endpoint.',
            parameters: [
                { position: { key: 'query', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'lineName', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'onlyCurrentlyRunning', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(true)'] } },
                { position: { key: 'currentlyStoppingAt', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Search for S1 trips', lineName: 'S1' },
                { _description: 'Find trips at Alexanderplatz', currentlyStoppingAt: '900100003' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { trips: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, line: { type: 'object' }, currentLocation: { type: 'object' }, stopovers: { type: 'array' } } } } } }
            }
        },
        searchStations: {
            method: 'GET',
            path: '/stations',
            description: 'Autocomplete VBB station names using vbb-stations dataset. Returns richer data than /locations including address and facilities.',
            parameters: [
                { position: { key: 'query', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'limit', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(3)'] } },
                { position: { key: 'fuzzy', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(false)'] } },
                { position: { key: 'completion', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'boolean()', options: ['optional()', 'default(true)'] } }
            ],
            tests: [
                { _description: 'Search Berlin stations', query: 'Berlin', limit: 5 },
                { _description: 'Fuzzy search Alexanderpltz', query: 'Alexanderpltz', fuzzy: true, limit: 3 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object' }
            }
        },
        getLines: {
            method: 'GET',
            path: '/lines',
            description: 'Search and filter VBB transit lines by name, operator, or transport mode. Returns line details with route variants.',
            parameters: [
                { position: { key: 'name', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'operator', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'mode', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Search for S-Bahn lines', name: 'S1' },
                { _description: 'Search for tram lines', mode: 'train' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, mode: { type: 'string' }, product: { type: 'string' }, operator: { type: 'object' }, variants: { type: 'array' } } } }
            }
        },
        getLine: {
            method: 'GET',
            path: '/lines/:id',
            description: 'Get detailed information about a specific transit line including all route variants with stop sequences.',
            parameters: [
                { position: { key: 'id', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } }
            ],
            tests: [
                { _description: 'Get S1 line details' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, mode: { type: 'string' }, variants: { type: 'array' } } }
            }
        },
        getShape: {
            method: 'GET',
            path: '/shapes/:id',
            description: 'Get GeoJSON geographic shape data for a route. Use shape IDs from trip or line data for route visualization on maps.',
            parameters: [
                { position: { key: 'id', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } }
            ],
            tests: [
                { _description: 'Get route shape (use ID from trip/line data)' }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { type: { type: 'string' }, coordinates: { type: 'array' } } }
            }
        }
    }
}
