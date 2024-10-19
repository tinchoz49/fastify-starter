import { Type } from '@sinclair/typebox'
import { sql } from 'drizzle-orm'

import type { App } from '~/app.js'

export default async function healthRoutes(app: App) {
  const { db } = app.drizzle

  const query = sql`SELECT * FROM pg_stat_activity`

  app.get('/health', {
    schema: {
      description: 'Get the health status of the API',
      tags: ['Health'],
      response: {
        200: Type.Object({
          status: Type.String({ description: 'The current status of the API', examples: ['ok', 'error'] }),
          environment: Type.String({ description: 'The current environment', examples: ['development', 'production'] }),
          timestamp: Type.String({ description: 'The current timestamp', format: 'date-time', examples: ['2023-04-01T12:00:00Z'] }),
          inMemory: Type.Boolean({ description: 'Whether the database is in memory', examples: [true, false] }),
        }, {
          description: 'Successful response',
          title: 'HealthCheckResponse',
        }),
        ...app.useErrors([
          'InternalServerError',
        ]),
      },
    },
  }, async () => {
    try {
      await db.execute(query)
      return {
        status: 'ok',
        environment: app.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        inMemory: app.env.DATABASE.RUN_IN_MEMORY,
      }
    } catch (error) {
      app.log.error(error)
      return {
        status: 'error',
        environment: app.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        inMemory: app.env.DATABASE.RUN_IN_MEMORY,
      }
    }
  })
}
