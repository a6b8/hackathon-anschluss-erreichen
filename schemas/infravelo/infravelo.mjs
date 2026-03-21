export const main = {
    namespace: 'infravelo',
    name: 'infraVelo - Berlin Cycling Infrastructure',
    description: 'Access Berlin cycling infrastructure project data from infraVelo. Get details on bike lanes, parking facilities, traffic signals, and infrastructure projects with geographic coordinates, status, milestones, and costs. GeoJSON format. Free, no API key required. License: dl-de/by-2-0.',
    version: '3.0.0',
    docs: ['https://www.infravelo.de/api/', 'https://www.infravelo.de/api/description/'],
    tags: ['cycling', 'infrastructure', 'berlin', 'germany', 'geojson', 'open-data', 'cacheTtlDaily'],
    root: 'https://www.infravelo.de/api/v1',
    requiredServerParams: [],
    headers: {},
    tools: {
        getAllProjects: {
            method: 'GET',
            path: '/projects/collections/projekte/',
            description: 'Get all cycling infrastructure projects in Berlin as GeoJSON FeatureCollection. Includes bike lanes, parking, traffic signals with coordinates, status, district, and cost info.',
            parameters: [],
            tests: [
                { _description: 'Get all Berlin cycling projects' }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        type: { type: 'string' },
                        features: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    geometry: { type: 'object' },
                                    properties: { type: 'object', properties: { title: { type: 'string' }, district: { type: 'string' }, status: { type: 'string' }, project_type: { type: 'string' } } }
                                }
                            }
                        }
                    }
                }
            }
        },
        getProjectsByDistrict: {
            method: 'GET',
            path: '/projects/district/:district/',
            description: 'Get cycling infrastructure projects filtered by Berlin district (Bezirk). Returns GeoJSON FeatureCollection.',
            parameters: [
                { position: { key: 'district', value: '{{USER_PARAM}}', location: 'insert' }, z: { primitive: 'string()', options: [] } }
            ],
            tests: [
                { _description: 'Get Mitte projects', district: 'mitte' },
                { _description: 'Get Friedrichshain-Kreuzberg projects', district: 'friedrichshain-kreuzberg' }
            ],
            output: {
                mimeType: 'application/json',
                schema: {
                    type: 'object',
                    properties: {
                        type: { type: 'string' },
                        features: { type: 'array', items: { type: 'object' } }
                    }
                }
            }
        }
    }
}
