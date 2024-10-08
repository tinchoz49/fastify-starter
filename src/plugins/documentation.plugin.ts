import fp from 'fastify-plugin'

import type { App } from '../app.js'

async function documentationPlugin(app: App) {
  if (!app.env.OPENAPI.ENABLED) {
    return
  }

  app.get('/openapi.json', () => app.swagger())

  const title = 'API Documentation'

  await app.register(import('@fastify/swagger'), {
    refResolver: {
      buildLocalReference(json, baseUri, fragment, i) {
        return String(json.$id || `def-${i}`)
      },
    },
    openapi: {
      info: {
        title,
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            description:
              'RSA256 JWT signed by private key, with username in payload',
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  if (app.env.OPENAPI.UI) {
    await app.register(import('@scalar/fastify-api-reference'), {
      routePrefix: '/documentation',
      configuration: {
        metaData: {
          title,
        },
        spec: {
          url: '/openapi.json',
        },
      },
    })
  }
}

export default fp(documentationPlugin, {
  name: 'core:documentation',
  decorators: {
    fastify: ['env'],
  },
})
