import type { FastifyRequest } from 'fastify'

import fp from 'fastify-plugin'

import type { App } from '~/app'

async function authPlugin(app: App) {
  app.register(import('@fastify/auth'))
  app.register(import('@fastify/jwt'), {
    secret: app.env.JWT.SECRET,
    verify: {
      cache: app.env.JWT.CACHE,
      cacheTTL: app.env.JWT.CACHE_TTL,
    },
  })

  app.decorate('verifyToken', async function verifyToken(request: FastifyRequest) {
    try {
      await request.jwtVerify()
    } catch (error) {
      request.log.error(error)
      throw new request.server.errors.JWTUnauthorizedError((error as Error).message)
    }
  })
}

export default fp(authPlugin, {
  name: 'core:auth',
  dependencies: ['better-error'],
  decorators: {
    fastify: ['env'],
  },
})

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: FastifyRequest) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      username: string
      email: string
    }
    user: {
      id: string
      username: string
      email: string
    }
  }
}
