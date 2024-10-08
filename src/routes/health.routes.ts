import { Type } from '@sinclair/typebox'
import { sql } from 'drizzle-orm'

import type { App } from '~/app.js'

export default async function healthRoutes(app: App) {
  const { db } = app.drizzle

  app.get('/health', {
    schema: {
      description: 'Get the health status of the API',
      tags: ['Health'],
      response: {
        200: Type.Object({
          status: Type.String({ description: 'The current status of the API', examples: ['ok', 'error'] }),
          environment: Type.String({ description: 'The current environment', examples: ['development', 'production'] }),
          timestamp: Type.String({ description: 'The current timestamp', format: 'date-time', examples: ['2023-04-01T12:00:00Z'] }),
        }, {
          description: 'Successful response',
          title: 'HealthCheckResponse',
        }),
        ...app.useErrors([
          'InternalServerError',
        ]),
      },
    },
  }, async (request) => {
    try {
      await db.execute(sql`SELECT * FROM pg_stat_activity`)
      return {
        status: 'ok',
        environment: app.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      app.log.error(error)
      return {
        status: 'error',
        environment: app.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }
    }
  })
}
