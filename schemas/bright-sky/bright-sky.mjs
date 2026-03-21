export const main = {
    namespace: 'brightsky',
    name: 'Bright Sky',
    description: 'Access German weather data from DWD (Deutscher Wetterdienst) including hourly forecasts, current conditions, weather alerts, and rainfall radar.',
    docs: ['https://brightsky.dev/docs/'],
    tags: ['weather', 'forecast', 'germany', 'dwd', 'meteorology', 'cacheTtlHourly'],
    version: '3.0.0',
    root: 'https://api.brightsky.dev',
    requiredServerParams: [],
    headers: {},
    tools: {
        getWeather: {
            method: 'GET',
            path: '/weather',
            description: 'Retrieve hourly weather observations and forecasts for a location in Germany. Provide location via lat/lon or DWD station ID, and a start date.',
            parameters: [
                { position: { key: 'date', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'last_date', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'dwd_station_id', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'units', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(dwd,si)', options: ['optional()', 'default(dwd)'] } },
                { position: { key: 'tz', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Get weather for Berlin today', lat: 52.52, lon: 13.405, date: '2025-01-15' },
                { _description: 'Get weather for Munich with date range', lat: 48.137, lon: 11.576, date: '2025-01-15', last_date: '2025-01-16' },
                { _description: 'Get weather by DWD station', dwd_station_id: '10382', date: '2025-01-15' }
            ],
        },
        getCurrentWeather: {
            method: 'GET',
            path: '/current_weather',
            description: 'Get the most recent weather observations for a location in Germany. Returns current conditions from the nearest DWD station.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'dwd_station_id', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'units', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(dwd,si)', options: ['optional()', 'default(dwd)'] } },
                { position: { key: 'tz', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Get current weather for Berlin', lat: 52.52, lon: 13.405 },
                { _description: 'Get current weather for Hamburg', lat: 53.551, lon: 9.994 },
                { _description: 'Get current weather for Frankfurt', lat: 50.11, lon: 8.682 }
            ],
        },
        getAlerts: {
            method: 'GET',
            path: '/alerts',
            description: 'Retrieve active weather alerts from DWD for a specific location in Germany. Returns all active alerts if no location is specified.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'warn_cell_id', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'tz', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Get all active weather alerts in Germany' },
                { _description: 'Get weather alerts for Munich', lat: 48.137, lon: 11.576 },
                { _description: 'Get weather alerts for Hamburg', lat: 53.551, lon: 9.994 }
            ],
        },
        getSources: {
            method: 'GET',
            path: '/sources',
            description: 'List available DWD weather observation stations near a given location, including station metadata and data availability.',
            parameters: [
                { position: { key: 'lat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'lon', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()'] } },
                { position: { key: 'max_dist', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(50000)'] } },
                { position: { key: 'dwd_station_id', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } }
            ],
            tests: [
                { _description: 'Get weather stations near Berlin', lat: 52.52, lon: 13.405 },
                { _description: 'Get weather stations near Munich within 100km', lat: 48.137, lon: 11.576, max_dist: 100000 },
                { _description: 'Get station info by DWD station ID', dwd_station_id: '10382' }
            ],
        }
    },
}