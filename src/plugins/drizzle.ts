import { Type } from '@sinclair/typebox'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import fp from 'fastify-plugin'

import type { App } from '../app.js'

import * as schema from '../db/schema.js'
import seed from '../db/seed.js'

type Schema = typeof schema
type DB = ReturnType<typeof drizzle<Schema>>

async function getMemoryConnection() {
  const { drizzle } = await import('drizzle-orm/pglite')
  return drizzle({
    schema,
    connection: {
      extensions: {
        uuid_ossp: (await import('@electric-sql/pglite/contrib/uuid_ossp')).uuid_ossp,
      },
    },
  }) as unknown as DB
}

export const DatabaseEnvSchema = Type.Intersect([
  Type.Union([
    Type.Object({
      URL: Type.String(),
    }),
    Type.Object({
      HOST: Type.String(),
      PORT: Type.Number(),
      USER: Type.String(),
      PASSWORD: Type.String(),
      NAME: Type.String(),
    }),
  ]),
  Type.Object({
    PATH: Type.Optional(Type.String()),
    SSL: Type.Optional(Type.Boolean()),
    MAX: Type.Optional(Type.Number()),
    MAX_LIFETIME: Type.Optional(Type.Number()),
    IDLE_TIMEOUT: Type.Optional(Type.Number()),
    CONNECT_TIMEOUT: Type.Optional(Type.Number()),
    RUN_IN_MEMORY: Type.Boolean({ default: false }),
    RUN_SEED: Type.Boolean({ default: false }),
    RUN_MIGRATE: Type.Boolean({ default: false }),
  }),
])

async function drizzlePlugin(app: App) {
  const { RUN_MIGRATE, RUN_SEED, RUN_IN_MEMORY, ...opts } = app.env.DATABASE

  let db: DB
  if (RUN_IN_MEMORY) {
    db = await getMemoryConnection()
  } else {
    db = drizzle({
      schema,
      connection: {
        ...('URL' in opts
          ? { url: opts.URL }
          : {
              host: opts.HOST,
              port: opts.PORT,
              user: opts.USER,
              password: opts.PASSWORD,
              database: opts.NAME,
            }),
        path: opts.PATH,
        ssl: opts.SSL,
        max: opts.MAX,
        idle_timeout: opts.IDLE_TIMEOUT,
        max_lifetime: opts.MAX_LIFETIME,
        connect_timeout: opts.CONNECT_TIMEOUT,
      },
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

  app.addHook('onReady', async () => {
    if (RUN_MIGRATE) {
      await app.drizzle.migrate()
    }

    if (RUN_SEED) {
      await app.drizzle.seed()
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
      db: DB
      entities: Schema
      migrate: () => Promise<void>
      seed: () => Promise<void>
    }
  }
}
