import type { Server as HttpServer } from 'node:http'
import type { Server as HttpsServer } from 'node:https'

import path from 'node:path'

import type { Static } from '@sinclair/typebox'

import autoload from '@fastify/autoload'
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { serverFactory } from '@geut/fastify-uws'
import fastify, { type FastifyHttpOptions, type FastifyHttpsOptions } from 'fastify'
import { type BetterErrorPlugin } from 'fastify-better-error'
import { type DeepPartial, parseEnv } from 'typebox-env'

import EnvSchema from './env.js'
import * as errors from './errors.js'

export interface AppOptions extends FastifyHttpOptions<HttpServer> {
  https?: FastifyHttpsOptions<HttpsServer>['https']
  env?: DeepPartial<Static<typeof EnvSchema>>
}

export const createApp = (options: AppOptions = {}) => {
  const hrstart = process.hrtime()

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
  app.register(import('fastify-better-error'), { errors })
  app.register(import('@fastify/cors'))
  app.register(import('@fastify/helmet'))

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

    const hrend = process.hrtime(hrstart)
    app.log.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
  })

  return app
}

export type App = ReturnType<typeof createApp>

declare module 'fastify' {
  interface FastifyInstance extends BetterErrorPlugin<typeof errors> {
    env: Static<typeof EnvSchema>
  }
}
