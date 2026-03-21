export const main = {
    namespace: 'flixbus',
    name: 'FlixBus',
    description: 'Search FlixBus and FlixTrain connections across Europe. Find cities and stations via autocomplete, search trips with real-time prices and availability, and discover departure stations. Free API, no authentication required.',
    version: '3.0.0',
    docs: ['https://global.api.flixbus.com'],
    tags: ['transport', 'bus', 'europe', 'travel', 'booking', 'cacheTtlFrequent'],
    root: 'https://global.api.flixbus.com',
    requiredServerParams: [],
    headers: {},
    tools: {
        autocompleteCities: {
            method: 'GET',
            path: '/search/autocomplete/cities',
            description: 'Search for FlixBus cities by name. Returns matching cities with UUIDs, coordinates, country, and whether they have a train station. Use the returned city ID for trip searches.',
            parameters: [
                { position: { key: 'q', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'lang', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default(en)'] } },
                { position: { key: 'country', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'flixbus_cities_only', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(true,false)', options: ['optional()', 'default(false)'] } }
            ],
            tests: [
                { _description: 'Search for Berlin cities', q: 'Berlin', lang: 'en', country: 'de' },
                { _description: 'Search for Paris cities', q: 'Paris', lang: 'en' },
                { _description: 'Search for Munich in German', q: 'Muenchen', lang: 'de', country: 'de' }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'array',
                    description: 'Array of matching city objects sorted by relevance score',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'City UUID for use in trip search' },
                            name: { type: 'string', description: 'City name' },
                            country: { type: 'string', description: 'ISO country code (de, fr, etc.)' },
                            district: { type: 'string', description: 'District or region name' },
                            location: { type: 'object', properties: { lon: { type: 'number' }, lat: { type: 'number' } } },
                            has_train_station: { type: 'boolean', description: 'Whether FlixTrain is available' },
                            is_flixbus_city: { type: 'boolean', description: 'Whether FlixBus serves this city' },
                            score: { type: 'number', description: 'Relevance score' }
                        }
                    }
                }
            }
        },
        autocompleteStations: {
            method: 'GET',
            path: '/search/autocomplete/stations',
            description: 'Search for FlixBus stations (bus stops) by name. Returns specific departure/arrival points within cities including address, city assignment, and whether it is a train station.',
            parameters: [
                { position: { key: 'q', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'lang', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default(en)'] } },
                { position: { key: 'country', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Search for Berlin stations', q: 'Berlin', lang: 'en', country: 'de' },
                { _description: 'Search for Hamburg stations', q: 'Hamburg', lang: 'en', country: 'de' }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'array',
                    description: 'Array of matching station objects sorted by relevance',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Station UUID' },
                            name: { type: 'string', description: 'Station name (e.g. Berlin central bus station)' },
                            address: { type: 'string', description: 'Street address of the station' },
                            zipcode: { type: 'string', description: 'Postal code' },
                            city: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, legacy_id: { type: 'number' } } },
                            country: { type: 'object', properties: { code: { type: 'string' }, name: { type: 'string' } } },
                            location: { type: 'object', properties: { lon: { type: 'number' }, lat: { type: 'number' } } },
                            is_train: { type: 'boolean', description: 'Whether this is a train station' },
                            importance_order: { type: 'number', description: 'Station importance ranking' },
                            score: { type: 'number', description: 'Search relevance score' }
                        }
                    }
                }
            }
        },
        searchTrips: {
            method: 'GET',
            path: '/search/service/v4/search',
            description: 'Search for FlixBus/FlixTrain trips between two cities. Returns available connections with prices, departure/arrival times, duration, available seats, and transport details. City IDs can be obtained from autocompleteCities. IMPORTANT: departure_date must be DD.MM.YYYY format. Do NOT set products — the default {"adult":1} is correct.',
            parameters: [
                { position: { key: 'from_city_id', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'to_city_id', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'departure_date', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'products', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default({"adult":1})'] } },
                { position: { key: 'search_by', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(cities,stations)', options: ['optional()', 'default(cities)'] } },
                { position: { key: 'currency', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default(EUR)'] } }
            ],
            tests: [
                { _description: 'Search Berlin to Munich trips', from_city_id: '40d8f682-8646-11e6-9066-549f350fcb0c', to_city_id: '40de8964-8646-11e6-9066-549f350fcb0c', departure_date: '15.03.2026', products: '{"adult":1}', search_by: 'cities', currency: 'EUR' },
                { _description: 'Search Hamburg to Berlin trips', from_city_id: '40d91e53-8646-11e6-9066-549f350fcb0c', to_city_id: '40d8f682-8646-11e6-9066-549f350fcb0c', departure_date: '20.03.2026', products: '{"adult":1}', search_by: 'cities', currency: 'EUR' }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        response_uuid: { type: 'string', description: 'Unique response identifier' },
                        trips: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    departure_city_id: { type: 'string' },
                                    arrival_city_id: { type: 'string' },
                                    date: { type: 'string', description: 'ISO 8601 departure date' },
                                    results: {
                                        type: 'object',
                                        description: 'Map of trip UIDs to trip details with status, departure/arrival, duration, price, and availability'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
