import { readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'


const SCHEMA_BASE = resolve( '../flowmcp-schemas/schemas/v3.0.0/flowmcp-community/providers' )


async function loadSchemas( { providers } ) {
    const schemas = []

    const loadPromises = providers
        .map( async ( provider ) => {
            const providerDir = join( SCHEMA_BASE, provider )

            try {
                const files = await readdir( providerDir )
                const mjsFiles = files
                    .filter( ( f ) => f.endsWith( '.mjs' ) )

                const schemaPromises = mjsFiles
                    .map( async ( file ) => {
                        const filePath = join( providerDir, file )
                        const fileUrl = pathToFileURL( filePath ).href
                        const module = await import( fileUrl )
                        const schema = module.main || module.default

                        if( schema ) {
                            const result = { ...schema }

                            if( module.handlers ) {
                                result.handlers = module.handlers
                            }

                            return result
                        }

                        return null
                    } )

                const results = await Promise.all( schemaPromises )

                results
                    .filter( Boolean )
                    .forEach( ( schema ) => { schemas.push( schema ) } )
            } catch( error ) {
                console.warn( `[schema-loader] Could not load schemas for provider "${provider}": ${error.message}` )
            }
        } )

    await Promise.all( loadPromises )

    console.log( `  Loaded ${schemas.length} schemas for providers: ${providers.join( ', ' )}` )

    return schemas
}


export { loadSchemas }
