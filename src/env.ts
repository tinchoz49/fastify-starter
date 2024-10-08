import { Type } from '@fastify/type-provider-typebox'

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

  DATABASE: Type.Intersect([
    Type.Union([
      Type.Object({
        IN_MEMORY: Type.Literal(true),
      }),
      Type.Object({
        HOST: Type.String(),
        PORT: Type.Number(),
        USER: Type.String(),
        PASSWORD: Type.String(),
        DB: Type.String(),
        PATH: Type.Optional(Type.String()),
        SSL: Type.Optional(Type.Boolean()),
        MAX: Type.Optional(Type.Number()),
        MAX_LIFETIME: Type.Optional(Type.Number()),
        IDLE_TIMEOUT: Type.Optional(Type.Number()),
        CONNECT_TIMEOUT: Type.Optional(Type.Number()),
      }),
    ]),
    Type.Object({
      RUN_SEED: Type.Boolean({ default: false }),
      RUN_MIGRATE: Type.Boolean({ default: false }),
    }),
  ]),

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
