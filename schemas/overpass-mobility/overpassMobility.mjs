export const main = {
    namespace: 'overpassmobility',
    name: 'Overpass Station Mobility',
    description: 'Specialized OpenStreetMap queries for mobility infrastructure around train stations. Find bike parking (with capacity/type), bus stops, accessibility features (elevators/wheelchair/tactile paving), and nearby amenities. All via Overpass API, free, no key required.',
    version: '3.0.0',
    docs: ['https://overpass-api.de/', 'https://wiki.openstreetmap.org/wiki/Overpass_API'],
    tags: ['osm', 'mobility', 'accessibility', 'bike-parking', 'stations', 'germany', 'cacheTtlDaily'],
    root: 'https://overpass-api.de/api',
    requiredServerParams: [],
    headers: {},
    tools: {
        findStationMobility: {
            method: 'GET',
            path: '/interpreter',
            description: 'Find ALL connecting mobility options around a station: bus stops, tram stops, taxi stands, bike rental, car sharing, bike parking. Returns a unified view of intermodal connections.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'radius', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(500)'] } }
            ],
            tests: [
                { _description: 'Find mobility around Berlin Hbf', lat: 52.525607, lon: 13.369072, radius: 500 },
                { _description: 'Find mobility around Potsdam Hbf', lat: 52.391443, lon: 13.067160, radius: 500 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { elements: { type: 'array', items: { type: 'object' } } } }
            }
        },
        findBikeInfrastructure: {
            method: 'GET',
            path: '/interpreter',
            description: 'Find bike parking spots, bike rental stations, and bike repair stations near coordinates. Returns capacity, type (stands/lockers/shed/wall_loops), covered status, fee, and operator.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'radius', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(500)'] } }
            ],
            tests: [
                { _description: 'Find bike infrastructure near Berlin Hbf', lat: 52.525607, lon: 13.369072, radius: 500 },
                { _description: 'Find bike infrastructure near Jannowitzbruecke', lat: 52.515, lon: 13.418, radius: 300 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { elements: { type: 'array', items: { type: 'object', properties: { id: { type: 'number' }, lat: { type: 'number' }, lon: { type: 'number' }, tags: { type: 'object' } } } } } }
            }
        },
        findAccessibility: {
            method: 'GET',
            path: '/interpreter',
            description: 'Find accessibility features near a station: elevators, wheelchair-accessible entrances, tactile paving, accessible toilets, audio signals at crossings. Essential for barrier-free journey planning.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'radius', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(300)'] } }
            ],
            tests: [
                { _description: 'Find accessibility near Berlin Hbf', lat: 52.525607, lon: 13.369072, radius: 300 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { elements: { type: 'array', items: { type: 'object' } } } }
            }
        },
        findStationAmenities: {
            method: 'GET',
            path: '/interpreter',
            description: 'Find essential amenities near a station: cafes, toilets, ATMs, pharmacies. Focused on the most common traveler needs for fast reliable results.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'radius', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(300)'] } }
            ],
            tests: [
                { _description: 'Find amenities near Berlin Hbf', lat: 52.525607, lon: 13.369072, radius: 300 },
                { _description: 'Find amenities near Bad Belzig', lat: 52.142, lon: 12.588, radius: 500 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { elements: { type: 'array', items: { type: 'object' } } } }
            }
        },
        findAccommodation: {
            method: 'GET',
            path: '/interpreter',
            description: 'Find hotels and hostels near coordinates. Returns name, address, phone, website, wheelchair access, and email. Essential for stranded travelers needing overnight accommodation.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } },
                { position: { key: 'radius', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(2000)'] } }
            ],
            tests: [
                { _description: 'Find hotels near Leipzig Hbf', lat: 51.3397, lon: 12.3731, radius: 2000 },
                { _description: 'Find hotels near Frankfurt Hbf', lat: 50.1072, lon: 8.6637, radius: 1500 }
            ],
            output: {
                mimeType: 'application/json',
                schema: { type: 'object', properties: { elements: { type: 'array', items: { type: 'object', properties: { id: { type: 'number' }, lat: { type: 'number' }, lon: { type: 'number' }, tags: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, website: { type: 'string' }, wheelchair: { type: 'string' }, tourism: { type: 'string' } } } } } } } }
            }
        }
    }
}

export const handlers = ( { sharedLists, libraries } ) => ( {
    findStationMobility: {
        preRequest: async ( { struct, payload } ) => {
            const { lat, lon, radius } = payload
            const r = radius || 500
            const query = `[out:json][timeout:15];(node["highway"="bus_stop"](around:${r},${lat},${lon});node["railway"="tram_stop"](around:${r},${lat},${lon});node["amenity"="taxi"](around:${r},${lat},${lon});node["amenity"="car_sharing"](around:${r},${lat},${lon});node["amenity"="bicycle_rental"](around:${r},${lat},${lon});node["amenity"="bicycle_parking"](around:${r},${lat},${lon});node["public_transport"="stop_position"](around:${r},${lat},${lon}););out body;`

            struct.url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent( query )}`

            return { struct, payload }
        }
    },
    findBikeInfrastructure: {
        preRequest: async ( { struct, payload } ) => {
            const { lat, lon, radius } = payload
            const r = radius || 500
            const query = `[out:json][timeout:15];(node["amenity"="bicycle_parking"](around:${r},${lat},${lon});way["amenity"="bicycle_parking"](around:${r},${lat},${lon});node["amenity"="bicycle_rental"](around:${r},${lat},${lon});node["amenity"="bicycle_repair_station"](around:${r},${lat},${lon});node["shop"="bicycle"](around:${r},${lat},${lon}););out body;`

            struct.url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent( query )}`

            return { struct, payload }
        }
    },
    findAccessibility: {
        preRequest: async ( { struct, payload } ) => {
            const { lat, lon, radius } = payload
            const r = radius || 300
            const query = `[out:json][timeout:15];(node["highway"="elevator"](around:${r},${lat},${lon});node["wheelchair"="yes"](around:${r},${lat},${lon});node["tactile_paving"="yes"](around:${r},${lat},${lon});node["amenity"="toilets"]["toilets:wheelchair"="yes"](around:${r},${lat},${lon});node["traffic_signals:sound"="yes"](around:${r},${lat},${lon}););out body;`

            struct.url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent( query )}`

            return { struct, payload }
        }
    },
    findStationAmenities: {
        preRequest: async ( { struct, payload } ) => {
            const { lat, lon, radius } = payload
            const r = radius || 300
            const query = `[out:json][timeout:10];(node["amenity"~"cafe|toilets|atm|pharmacy"](around:${r},${lat},${lon}););out body;`

            struct.url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent( query )}`

            return { struct, payload }
        }
    },
    findAccommodation: {
        preRequest: async ( { struct, payload } ) => {
            const { lat, lon, radius } = payload
            const r = radius || 2000
            const query = `[out:json][timeout:10];(node["tourism"~"hotel|hostel"](around:${r},${lat},${lon});way["tourism"~"hotel|hostel"](around:${r},${lat},${lon}););out body;`

            struct.url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent( query )}`

            return { struct, payload }
        }
    }
} )
