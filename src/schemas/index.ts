import fp from 'fastify-plugin'

import type { App } from '~/app'

import * as posts from './posts'
import * as users from './users'

const schemas = {
  ...posts,
  ...users,
}

async function schemaLoaderPlugin(app: App) {
  Object.values(schemas).forEach((schema) => {
    app.addSchema(schema)
  })
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
