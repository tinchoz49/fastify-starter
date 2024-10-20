import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { Argon2id } from 'oslo/password'
import request from 'supertest'

import { createApp } from '~/app.js'

const argon2id = new Argon2id()

describe('Auth API', () => {
  const app = createApp({
    env: {
      DATABASE: {
        URL: 'postgresql://localhost:5432/db',
        RUN_IN_MEMORY: true,
        RUN_MIGRATE: true,
        RUN_SEED: true,
      },
      JWT: {
        SECRET: 'test',
      },
    },
  })

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/login', () => {
    test('should login a user with valid credentials', async () => {
      // Create a test user
      const passwordHash = await argon2id.hash('P@22w0rd')

      await app.drizzle.db.insert(app.drizzle.entities.users).values({
        username: 'testuser',
        email: 'testuser@example.com',
        passwordHash,
      }).returning()

      const res = await request(app.server)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'P@22w0rd',
        })
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe('testuser')
      expect(res.body.user.email).toBe('testuser@example.com')
    })

    test('should return 401 for invalid credentials', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(res.body.code).toBe(app.errors.UnauthorizedError.code)
    })
  })

  describe('POST /api/signup', () => {
    test('should register a new user', async () => {
      const res = await request(app.server)
        .post('/api/signup')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'P@22w0rd',
        })
        .expect(201)
        .expect('Content-Type', /json/)

      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe('newuser')
      expect(res.body.user.email).toBe('newuser@example.com')
    })

    test('should return 409 for existing username or email', async () => {
      // Create a test user
      await app.drizzle.db.insert(app.drizzle.entities.users).values({
        username: 'existinguser',
        email: 'existing@example.com',
        passwordHash: await argon2id.hash('P@22w0rd'),
      })

      const res = await request(app.server)
        .post('/api/signup')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'P@22w0rd',
        })
        .expect(409)

      expect(res.body.code).toBe(app.errors.ConflictError.code)
    })

    test('should return 400 for invalid password', async () => {
      const res = await request(app.server)
        .post('/api/signup')
        .send({
          username: 'invaliduser',
          email: 'invalid@example.com',
          password: 'weakpassword',
        })
        .expect(400)

      expect(res.body.code).toBe(app.errors.ValidationError.code)
    })
  })

  describe('GET /api/profile', () => {
    test('should return the authenticated user profile', async () => {
      // Create a test user
      const testUser = await app.drizzle.db.insert(app.drizzle.entities.users).values({
        username: 'profileuser',
        email: 'profile@example.com',
        passwordHash: await argon2id.hash('P@22w0rd'),
      }).returning()

      const token = app.jwt.sign({ id: testUser[0].id, username: testUser[0].username, email: testUser[0].email })

      const res = await request(app.server)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.body.username).toBe('profileuser')
      expect(res.body.email).toBe('profile@example.com')
    })

    test('should return 401 for unauthenticated request', async () => {
      const res = await request(app.server)
        .get('/api/profile')
        .expect(401)

      expect(res.body.code).toBe(app.errors.JWTUnauthorizedError.code)
    })
  })
})
