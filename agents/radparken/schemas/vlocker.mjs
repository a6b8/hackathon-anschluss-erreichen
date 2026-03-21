export const main = {
    namespace: 'vlocker',
    name: 'V-Locker',
    description: 'Access V-Locker smart bicycle parking infrastructure in Switzerland — tower groups, box availability, and community location wishes',
    version: '3.0.0',
    docs: 'https://live.v-locker.ch',
    tags: ['bicycle', 'parking', 'switzerland', 'mobility', 'infrastructure'],
    root: 'https://live.v-locker.ch',
    requiredServerParams: [],
    tools: {
        getTowerGroups: {
            method: 'GET',
            path: '/api/public/towers/groups',
            description: 'List all V-Locker tower groups (locations) with capacity, availability, geo coordinates, tariffs, and payment methods. Returns 17 locations worldwide.',
            parameters: [],
            tests: [
                { _description: 'Get all V-Locker locations worldwide' }
            ]
        },
        getBoxAvailability: {
            method: 'GET',
            path: '/api/public/towers/groups/:towerGroupId/boxAvailabilityByType',
            description: 'Get box availability breakdown by type for a specific tower group. Use towerGroupId from getTowerGroups results.',
            parameters: [
                { position: { key: 'towerGroupId', value: '{{USER_PARAM}}', location: 'path' }, z: { primitive: 'number()', options: [] } }
            ],
            tests: [
                { _description: 'Get availability for DB Halle (ID 1)', towerGroupId: 1 }
            ]
        },
        getTowerWishes: {
            method: 'GET',
            path: '/api/public/towerwishes',
            description: 'List all community-submitted location wishes for new V-Locker installations. Returns 502 wishes.',
            parameters: [],
            tests: [
                { _description: 'Get all community location wishes' }
            ]
        }
    }
}
