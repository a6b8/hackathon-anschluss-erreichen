import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'


class EnvironmentManager {
    static load( { required, optional = [], envFile } ) {
        const nodeEnv = process.env.NODE_ENV || 'development'
        const isDev = nodeEnv === 'development'

        if( isDev && envFile ) {
            EnvironmentManager.#loadEnvFile( { envFile } )
        }

        const { missing } = EnvironmentManager.#validate( { required } )

        if( missing.length > 0 ) {
            console.error( `\n[EnvironmentManager] FATAL: Missing required environment variables:\n` )
            missing
                .forEach( ( varName ) => {
                    console.error( `  - ${varName}` )
                } )
            console.error( `\nEnvironment: ${nodeEnv}` )

            if( isDev ) {
                console.error( `Env file: ${envFile || 'none'}` )
            }

            console.error( '' )
            process.exit( 1 )
        }

        const env = {}

        required
            .forEach( ( varName ) => {
                env[ varName ] = process.env[ varName ]
            } )

        optional
            .forEach( ( varName ) => {
                if( process.env[ varName ] ) {
                    env[ varName ] = process.env[ varName ]
                }
            } )

        console.log( `[EnvironmentManager] Loaded ${required.length} required vars (${nodeEnv})` )

        return env
    }


    static #loadEnvFile( { envFile } ) {
        const filePath = resolve( envFile )

        try {
            const content = readFileSync( filePath, 'utf-8' )
            const lines = content.split( '\n' )

            lines
                .forEach( ( line ) => {
                    const trimmed = line.trim()

                    if( !trimmed || trimmed.startsWith( '#' ) ) {
                        return
                    }

                    const eqIndex = trimmed.indexOf( '=' )

                    if( eqIndex === -1 ) {
                        return
                    }

                    const key = trimmed.slice( 0, eqIndex ).trim()
                    const value = trimmed.slice( eqIndex + 1 ).trim()

                    if( !process.env[ key ] ) {
                        process.env[ key ] = value
                    }
                } )
        } catch( error ) {
            console.error( `[EnvironmentManager] FATAL: Could not read env file: ${filePath}` )
            console.error( `  Error: ${error.message}` )
            process.exit( 1 )
        }
    }


    static #validate( { required } ) {
        const missing = required
            .filter( ( varName ) => {
                const value = process.env[ varName ]

                return !value || value.trim() === ''
            } )

        return { missing }
    }
}


export { EnvironmentManager }
