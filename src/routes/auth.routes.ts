import { Type } from '@sinclair/typebox'
import { Argon2id } from 'oslo/password'

import type { App } from '~/app.js'

const argon2id = new Argon2id()

export default async function authRoutes(app: App) {
  const { SignupSchema, UserSchema } = app.schemas

  const { db, entities } = app.drizzle

  app.post('/login', {
    schema: {
      description: 'Login a user',
      tags: ['Auth'],
      body: Type.Object({
        username: Type.String(),
        password: Type.String(),
      }, { title: 'LoginRequest' }),
      response: {
        200: Type.Object({
          token: Type.String(),
          user: Type.Ref(UserSchema),
        }, {
          description: 'Successful login',
          title: 'LoginResponse',
        }),
        ...app.useErrors([
          'ValidationError',
          'UnauthorizedError',
          'InternalServerError',
        ]),
      },
    },
  }, async (request, reply) => {
    const { username, password } = request.body

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    })

    if (!user) {
      throw new app.errors.UnauthorizedError('Invalid username or password')
    }

    const isPasswordValid = await argon2id.verify(user.passwordHash, password)

    if (!isPasswordValid) {
      throw new app.errors.UnauthorizedError('Invalid username or password')
    }

    const token = app.jwt.sign({ id: user.id, username: user.username, email: user.email })

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }
  })

  app.post('/signup', {
    schemaErrorFormatter: (errors, dataVar) => {
      const passwordError = errors.find(error => error.schemaPath.endsWith('/password/pattern'))
      if (passwordError) {
        passwordError.message = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      }
      throw app.errors.ValidationError.fromSchemaValidator(errors, dataVar)
    },
    schema: {
      description: 'Register a new user',
      tags: ['Auth'],
      body: Type.Ref(SignupSchema),
      response: {
        201: Type.Object({
          token: Type.String(),
          user: Type.Ref(UserSchema),
        }, {
          description: 'Successful registration',
          title: 'SignupResponse',
        }),
        ...app.useErrors([
          'ValidationError',
          'ConflictError',
          'InternalServerError',
        ]),
      },
    },
  }, async (request, reply) => {
    const { username, email, password } = request.body

    const existingUser = await db.query.users.findFirst({
      where: (users, { or, eq }) => or(eq(users.username, username), eq(users.email, email)),
    })

    if (existingUser) {
      throw new app.errors.ConflictError('Username or email already exists')
    }

    const passwordHash = await argon2id.hash(password)

    const newUser = await db.insert(entities.users).values({
      username,
      email,
      passwordHash,
    }).returning()

    const token = app.jwt.sign({ id: newUser[0].id, username: newUser[0].username, email: newUser[0].email })

    reply.code(201)
    return {
      token,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
      },
    }
  })

  app.get('/profile', {
    onRequest: [
      app.auth([
        app.verifyToken,
      ]),
    ],
    schema: {
      description: 'Get the authenticated user',
      tags: ['Auth'],
      security: [
        {
          BearerAuth: [],
        },
      ],
      response: {
        200: Type.Ref(UserSchema, {
          description: 'Successful response',
          title: 'GetAuthenticatedUserResponse',
        }),
        ...app.useErrors([
          'ValidationError',
          'NotFoundError',
          'InternalServerError',
        ]),
      },
    },
  }, async (request) => {
    const { id } = request.user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    })
    if (!user) {
      throw new app.errors.NotFoundError('User not found')
    }
    return user
  })
}
