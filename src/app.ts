import type { Server } from 'node:http'

import path from 'node:path'

import type { Static } from '@sinclair/typebox'

import autoload from '@fastify/autoload'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { serverFactory } from '@geut/fastify-uws'
import fastify, { type FastifyHttpOptions } from 'fastify'
import errorPlugin, { type BetterErrorPlugin } from 'fastify-better-error'
import { type DeepPartial, parseEnv } from 'typebox-env'

import EnvSchema from './env.js'
import * as errors from './errors.js'

export interface AppOptions extends FastifyHttpOptions<Server> {
  env?: DeepPartial<Static<typeof EnvSchema>>
}

export const createApp = (options: AppOptions = {}) => {
  const { env: envOptions = {}, ...fastifyOptions } = options

  const env = parseEnv(EnvSchema, {
    ...process.env,
    ...envOptions,
  })

  const app = fastify({
    ...fastifyOptions,
    logger: env.LOG_LEVEL && {
      level: env.LOG_LEVEL,
    },
    serverFactory,
    ajv: {
      ...(fastifyOptions?.ajv || {}),
      plugins: [
        ...(fastifyOptions?.ajv?.plugins || []),
        // this is required to allow the use of the x-examples keyword in the OpenAPI schema
        (ajv: any) => ajv.addKeyword({ keyword: 'x-examples' }),
      ],
    },
  })
    .withTypeProvider<TypeBoxTypeProvider>()

  // setup environments
  app.decorate('env', env)

  // fastify plugins
  app.register(errorPlugin, { errors })
  app.register(fastifyCors)
  app.register(fastifyHelmet)

  // user plugins
  app.register(autoload, {
    dir: path.join(import.meta.dirname, 'plugins'),
    matchFilter: /\.plugin\.(ts|js)$/i,
    forceESM: true,
    encapsulate: false,
  })

  // routes
  app.register(autoload, {
    dir: path.join(import.meta.dirname, 'routes'),
    matchFilter: /\.routes\.(ts|js)$/i,
    autoHooks: true,
    autoHooksPattern: /^_hooks\.(ts|js)$/i,
    forceESM: true,
    options: {
      prefix: '/api',
    },
  })

  app.addHook('onReady', async () => {
    if (env.DATABASE.RUN_MIGRATE) {
      await app.drizzle.migrate()
    }

    if (env.DATABASE.RUN_SEED) {
      await app.drizzle.seed()
    }
  })

  return app
}

export type App = ReturnType<typeof createApp>

declare module 'fastify' {
  interface FastifyInstance extends BetterErrorPlugin<typeof errors> {
    env: Static<typeof EnvSchema>
  }
}
