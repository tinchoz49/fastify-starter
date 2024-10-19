import { Type } from '@fastify/type-provider-typebox'

import { DatabaseEnvSchema } from './plugins/drizzle.plugin.js'

export default Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ], { default: 'production' }),

  HOST: Type.String({ default: '127.0.0.1' }),

  PORT: Type.Number({ default: 3000 }),

  LOG_LEVEL: Type.Optional(
    Type.Union([
      Type.Literal('info'),
      Type.Literal('error'),
      Type.Literal('debug'),
      Type.Literal('fatal'),
      Type.Literal('warn'),
      Type.Literal('trace'),
      Type.Literal('child'),
    ])
  ),

  DATABASE: DatabaseEnvSchema,

  JWT: Type.Object({
    SECRET: Type.String({ description: 'Secret key for JWT token generation and verification' }),
    CACHE: Type.Optional(
      Type.Union([
        Type.Number(),
        Type.Boolean(),
      ], { default: false })
    ),
    CACHE_TTL: Type.Optional(Type.Number({ default: 60_000 })),
  }),

  OPENAPI: Type.Object({
    ENABLED: Type.Boolean({ default: false }),
    UI: Type.Optional(Type.Boolean({ default: false })),
  }, { default: { ENABLED: false } }),
})
