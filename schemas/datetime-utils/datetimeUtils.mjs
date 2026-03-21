// datetime-utils — Local date/time utility tools
// No external API calls — pure local computation using Intl.DateTimeFormat

export const main = {
    namespace: 'datetimeutils',
    name: 'Datetime Utils',
    description: 'Date and time utility tools for current datetime, arithmetic and format conversion. Pure local computation, no external API needed. Useful for travel queries, schedule searches, and date formatting across different API requirements.',
    version: '3.0.0',
    docs: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat'],
    tags: ['utility', 'datetime', 'local', 'formatting'],
    root: '',
    requiredServerParams: [],
    headers: {},
    tools: {
        getCurrentDatetime: {
            method: 'GET',
            path: '/',
            description: 'Get current date and time. Use this when you need to know the current date for travel queries, weather lookups, schedule searches, or ticket bookings. Supports multiple output formats and timezones.',
            parameters: [
                { position: { key: 'timezone', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default(Europe/Berlin)'] } },
                { position: { key: 'format', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(iso,date,time,datetime,german,compact,unix,flixbus)', options: ['optional()', 'default(iso)'] } }
            ],
            tests: [
                { _description: 'Get current datetime in ISO format', format: 'iso' },
                { _description: 'Get current date only', format: 'date' },
                { _description: 'Get current time in German format', format: 'german', timezone: 'Europe/Berlin' },
                { _description: 'Get FlixBus date format', format: 'flixbus' },
                { _description: 'Get Unix timestamp', format: 'unix' }
            ]
        },
        addToDatetime: {
            method: 'GET',
            path: '/add',
            description: 'Add hours, days, or minutes to a date. Use this for relative time expressions like "tomorrow", "in 2 hours", "next week". If no base date is given, uses current time. Returns result in requested format.',
            parameters: [
                { position: { key: 'date', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()'] } },
                { position: { key: 'hours', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(0)'] } },
                { position: { key: 'days', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(0)'] } },
                { position: { key: 'minutes', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'number()', options: ['optional()', 'default(0)'] } },
                { position: { key: 'timezone', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default(Europe/Berlin)'] } },
                { position: { key: 'format', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(iso,date,time,datetime,german,compact,unix,flixbus)', options: ['optional()', 'default(iso)'] } }
            ],
            tests: [
                { _description: 'Add 1 day (tomorrow)', days: 1, format: 'date' },
                { _description: 'Add 2 hours to now', hours: 2, format: 'datetime' },
                { _description: 'Add 3 days in German format', days: 3, format: 'german' },
                { _description: 'Add 30 minutes', minutes: 30, format: 'time' },
                { _description: 'Add 1 day in FlixBus format', days: 1, format: 'flixbus' }
            ]
        },
        formatDatetime: {
            method: 'GET',
            path: '/format',
            description: 'Convert a date string between formats. Use this when you have a date in one format and need it in another format for a different API. Supports ISO, German (DD.MM.YYYY), compact (YYYYMMDD), FlixBus (DD.MM.YYYY), and more.',
            parameters: [
                { position: { key: 'date', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: [] } },
                { position: { key: 'outputFormat', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'enum(iso,date,time,datetime,german,compact,unix,flixbus)', options: [] } },
                { position: { key: 'timezone', value: '{{USER_PARAM}}', location: 'query' }, z: { primitive: 'string()', options: ['optional()', 'default(Europe/Berlin)'] } }
            ],
            tests: [
                { _description: 'ISO to German format', date: '2026-03-18', outputFormat: 'german' },
                { _description: 'ISO to compact', date: '2026-03-18T14:30:00', outputFormat: 'compact' },
                { _description: 'German to ISO', date: '18.03.2026', outputFormat: 'iso' },
                { _description: 'ISO to FlixBus format', date: '2026-03-20', outputFormat: 'flixbus' },
                { _description: 'ISO to datetime', date: '2026-03-18T22:30:00+01:00', outputFormat: 'datetime' }
            ]
        }
    }
}


export const handlers = () => {

    const formatDate = ( { date, format, timezone } ) => {
        const tz = timezone || 'Europe/Berlin'

        const formatter = new Intl.DateTimeFormat( 'de-DE', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        } )

        const parts = formatter.formatToParts( date )
        const get = ( type ) => parts.find( ( p ) => p.type === type )?.value || ''

        const year = get( 'year' )
        const month = get( 'month' )
        const day = get( 'day' )
        const hour = get( 'hour' )
        const minute = get( 'minute' )
        const second = get( 'second' )

        const tzOffsetFormatter = new Intl.DateTimeFormat( 'en-US', {
            timeZone: tz,
            timeZoneName: 'shortOffset'
        } )
        const tzParts = tzOffsetFormatter.formatToParts( date )
        const tzOffset = tzParts.find( ( p ) => p.type === 'timeZoneName' )?.value || '+00:00'
        const offsetStr = tzOffset === 'GMT' ? '+00:00' : tzOffset.replace( 'GMT', '' )
        const offsetMatch = offsetStr.match( /^([+-])(\d{1,2})(?::(\d{2}))?$/ )
        const normalizedOffset = offsetMatch
            ? `${offsetMatch[ 1 ]}${offsetMatch[ 2 ].padStart( 2, '0' )}:${offsetMatch[ 3 ] || '00'}`
            : offsetStr

        const formats = {
            iso: `${year}-${month}-${day}T${hour}:${minute}:${second}${normalizedOffset}`,
            date: `${year}-${month}-${day}`,
            time: `${hour}:${minute}`,
            datetime: `${year}-${month}-${day} ${hour}:${minute}`,
            german: `${day}.${month}.${year}`,
            compact: `${year}${month}${day}`,
            unix: String( Math.floor( date.getTime() / 1000 ) ),
            flixbus: `${day}.${month}.${year}`
        }

        return formats[ format ] || formats[ 'iso' ]
    }


    const parseInputDate = ( { dateStr } ) => {
        if( !dateStr ) {
            return new Date()
        }

        // German format: DD.MM.YYYY or DD.MM.YYYY HH:MM
        const germanMatch = dateStr.match( /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/ )
        if( germanMatch ) {
            const [ , dd, mm, yyyy, hh, min ] = germanMatch

            return new Date( `${yyyy}-${mm}-${dd}T${hh || '00'}:${min || '00'}:00` )
        }

        // Compact format: YYYYMMDD
        const compactMatch = dateStr.match( /^(\d{4})(\d{2})(\d{2})$/ )
        if( compactMatch ) {
            const [ , yyyy, mm, dd ] = compactMatch

            return new Date( `${yyyy}-${mm}-${dd}T00:00:00` )
        }

        // Unix timestamp (pure digits, 10+ chars)
        const unixMatch = dateStr.match( /^(\d{10,13})$/ )
        if( unixMatch ) {
            const ts = parseInt( unixMatch[ 1 ], 10 )
            const msTs = ts > 9999999999 ? ts : ts * 1000

            return new Date( msTs )
        }

        // ISO or other standard formats
        const parsed = new Date( dateStr )
        if( isNaN( parsed.getTime() ) ) {
            throw new Error( `Cannot parse date: "${dateStr}". Supported formats: ISO (2026-03-18), German (18.03.2026), compact (20260318), Unix timestamp.` )
        }

        return parsed
    }


    return {
        getCurrentDatetime: {
            executeRequest: async ( { struct, payload } ) => {
                const { userParams } = payload
                const { timezone = 'Europe/Berlin', format = 'iso' } = userParams

                const now = new Date()
                const formatted = formatDate( { date: now, format, timezone } )

                struct['status'] = true
                struct['data'] = {
                    datetime: formatted,
                    timezone,
                    format,
                    utcTimestamp: now.toISOString()
                }

                return { struct }
            }
        },
        addToDatetime: {
            executeRequest: async ( { struct, payload } ) => {
                const { userParams } = payload
                const {
                    date: dateStr,
                    hours = 0,
                    days = 0,
                    minutes = 0,
                    timezone = 'Europe/Berlin',
                    format = 'iso'
                } = userParams

                const baseDate = parseInputDate( { dateStr } )
                const originalFormatted = formatDate( { date: baseDate, format, timezone } )

                const totalMs = ( Number( days ) * 86400000 ) + ( Number( hours ) * 3600000 ) + ( Number( minutes ) * 60000 )
                const resultDate = new Date( baseDate.getTime() + totalMs )
                const resultFormatted = formatDate( { date: resultDate, format, timezone } )

                struct['status'] = true
                struct['data'] = {
                    original: originalFormatted,
                    result: resultFormatted,
                    added: {
                        days: Number( days ),
                        hours: Number( hours ),
                        minutes: Number( minutes )
                    },
                    timezone,
                    format
                }

                return { struct }
            }
        },
        formatDatetime: {
            executeRequest: async ( { struct, payload } ) => {
                const { userParams } = payload
                const { date: dateStr, outputFormat, timezone = 'Europe/Berlin' } = userParams

                const parsed = parseInputDate( { dateStr } )
                const formatted = formatDate( { date: parsed, format: outputFormat, timezone } )

                struct['status'] = true
                struct['data'] = {
                    original: dateStr,
                    formatted,
                    outputFormat,
                    timezone
                }

                return { struct }
            }
        }
    }
}
