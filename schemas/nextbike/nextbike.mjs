export const main = {
    namespace: 'nextbike',
    name: 'nextbike Bike Sharing',
    description: 'Access nextbike bike sharing data via the legacy API. Get station locations, real-time bike availability, and system information for 50+ German networks including Berlin, Leipzig, and more. Free, no API key required.',
    version: '3.0.0',
    docs: ['https://github.com/ubahnverleih/WoBike/blob/master/Nextbike.md'],
    tags: ['transport', 'bike-sharing', 'germany', 'mobility', 'cacheTtlFrequent'],
    root: 'https://api.nextbike.net/maps',
    requiredServerParams: [],
    headers: {},
    tools: {
        getStationsAndBikes: {
            method: 'GET',
            path: '/nextbike-live.json',
            description: 'Get all stations and available bikes for a nextbike city/network. Returns station locations, capacity, available bikes by type, and individual bike details. Use city parameter for specific networks (e.g. 362 for Berlin).',
            parameters: [
                { position: { key: 'city', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: [] } }
            ],
            tests: [
                { _description: 'Get Berlin nextbike stations', city: 362 },
                { _description: 'Get Leipzig nextbike stations', city: 1 }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        countries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    cities: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                uid: { type: 'number' },
                                                name: { type: 'string' },
                                                available_bikes: { type: 'number' },
                                                num_places: { type: 'number' },
                                                places: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            uid: { type: 'number' },
                                                            name: { type: 'string' },
                                                            lat: { type: 'number' },
                                                            lng: { type: 'number' },
                                                            bikes: { type: 'number' },
                                                            bike_racks: { type: 'number' },
                                                            free_racks: { type: 'number' },
                                                            bikes_available_to_rent: { type: 'number' }
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
                }
            }
        },
        getAllNetworks: {
            method: 'GET',
            path: '/nextbike-live.json',
            description: 'Get a list of all nextbike networks/cities worldwide with summary statistics. Returns country, city names, available bikes count, and network metadata. No city parameter returns all networks.',
            parameters: [
                { position: { key: 'list_cities', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(1)'] } }
            ],
            tests: [
                { _description: 'List all nextbike networks', list_cities: 1 }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        countries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    country: { type: 'string' },
                                    cities: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                uid: { type: 'number' },
                                                name: { type: 'string' },
                                                available_bikes: { type: 'number' },
                                                num_places: { type: 'number' }
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
    }
}
