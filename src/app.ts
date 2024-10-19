import type { Server as HttpServer } from 'node:http'
import type { Server as HttpsServer } from 'node:https'

import type { Static } from '@sinclair/typebox'

import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { serverFactory } from '@geut/fastify-uws'
import fastify, { type FastifyHttpOptions, type FastifyHttpsOptions } from 'fastify'
import { type BetterErrorPlugin } from 'fastify-better-error'
import { type DeepPartial, parseEnv } from 'typebox-env'

import EnvSchema from './env.js'
import * as errors from './errors.js'

type AppOptions = Partial<FastifyHttpsOptions<HttpsServer>> & FastifyHttpOptions<HttpServer> & {
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

  // setup parsed environment variables
  app.decorate('env', env)

  // fastify plugins
  app.register(import('fastify-better-error'), { errors })
  app.register(import('./plugins/auth.js'))
  app.register(import('./plugins/documentation.js'))
  app.register(import('./plugins/drizzle.js'))
  app.register(import('./plugins/schema-loader.js'))

  // routes
  app.register(import('./routes/index.js'), { prefix: '/api' })

  app.addHook('onReady', async () => {
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
