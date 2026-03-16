import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'


async function loadManifest( { path } ) {
    const absolutePath = resolve( path )
    const fileUrl = pathToFileURL( absolutePath ).href
    const module = await import( fileUrl )

    const manifest = module.agent || module.default || module

    return manifest
}


export { loadManifest }
