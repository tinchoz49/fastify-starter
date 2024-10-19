import fp from 'fastify-plugin'

import type { App } from '~/app.js'

import * as schemas from '~/schemas/index.js'

async function schemaLoaderPlugin(app: App) {
  Object.values(schemas).forEach(schema => app.addSchema(schema))
  app.decorate('schemas', schemas)
}

export default fp(schemaLoaderPlugin, {
  name: 'core:schema-loader',
})

declare module 'fastify' {
  interface FastifyInstance {
    schemas: typeof schemas
  }
}
