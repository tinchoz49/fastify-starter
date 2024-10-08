import { drizzle, migrate } from 'drizzle-orm/connect'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import fp from 'fastify-plugin'

import type { App } from '../app.js'

import * as schema from '../db/schema.js'
import seed from '../db/seed.js'

type DB = Awaited<ReturnType<typeof drizzle<'postgres-js', typeof schema>>>

async function drizzlePlugin(app: App) {
  const env = app.env.DATABASE
  const inMemory = 'IN_MEMORY' in env
  let db: DB
  const dbConnection = inMemory
    ? {
        extensions: {
          uuid_ossp: (await import('@electric-sql/pglite/contrib/uuid_ossp')).uuid_ossp,
        },
      }
    : {
        host: env.HOST,
        port: env.PORT,
        user: env.USER,
        password: env.PASSWORD,
        database: env.DB,
        path: env.PATH,
        ssl: env.SSL,
        max: env.MAX,
        idle_timeout: env.IDLE_TIMEOUT,
        max_lifetime: env.MAX_LIFETIME,
        connect_timeout: env.CONNECT_TIMEOUT,
      }

  if (inMemory) {
    db = await drizzle('pglite', {
      schema,
      connection: dbConnection,
    }) as unknown as DB
  } else {
    db = await drizzle('postgres-js', {
      schema,
      connection: dbConnection,
    })
  }

  const dbMigrate = async () => {
    app.log.info('Running migrations')
    await migrate(db, { migrationsFolder: 'migrations' })
  }

  const dbSeed = async () => {
    app.log.info('Running seed')
    await seed(db)
  }

  app.addHook('onClose', async () => {
    const client = db.$client
    if (client && 'end' in client) {
      await client.end()
    }
  })

  app.decorate('drizzle', {
    db,
    entities: schema,
    migrate: dbMigrate,
    seed: dbSeed,
  })
}

export default fp(drizzlePlugin, {
  name: 'core:drizzle',
  decorators: {
    fastify: ['env'],
  },
})

declare module 'fastify' {
  interface FastifyInstance {
    drizzle: {
      db: PostgresJsDatabase<typeof schema>
      entities: typeof schema
      migrate: () => Promise<void>
      seed: () => Promise<void>
    }
  }
}
