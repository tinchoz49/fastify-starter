import { createError } from 'fastify-better-error'

export const JWTUnauthorizedError = createError(401, 'ERR_JWT_UNAUTHORIZED', '%s')
