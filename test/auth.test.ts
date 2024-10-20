import assert from 'node:assert'
import { after, before, describe, test } from 'node:test'

import { Argon2id } from 'oslo/password'

import { createApp } from '../src/app.js'

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

  before(async () => {
    await app.ready()
  })

  after(async () => {
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

      const res = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: {
          username: 'testuser',
          password: 'P@22w0rd',
        },
      })

      assert.strictEqual(res.statusCode, 200)
      const body = res.json()
      assert(body.token)
      assert.strictEqual(body.user.username, 'testuser')
      assert.strictEqual(body.user.email, 'testuser@example.com')
    })

    test('should return 401 for invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: {
          username: 'nonexistent',
          password: 'wrongpassword',
        },
      })

      assert.strictEqual(response.statusCode, 401)
    })
  })

  describe('POST /api/signup', () => {
    test('should register a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/signup',
        payload: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'P@22w0rd',
        },
      })

      assert.strictEqual(response.statusCode, 201)
      const body = JSON.parse(response.body)
      assert(body.token)
      assert.strictEqual(body.user.username, 'newuser')
      assert.strictEqual(body.user.email, 'newuser@example.com')
    })

    test('should return 409 for existing username or email', async () => {
      // Create a test user
      await app.drizzle.db.insert(app.drizzle.entities.users).values({
        username: 'existinguser',
        email: 'existing@example.com',
        passwordHash: await argon2id.hash('P@22w0rd'),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/signup',
        payload: {
          username: 'existinguser',
          email: 'new@example.com',
          password: 'P@22w0rd',
        },
      })

      assert.strictEqual(response.statusCode, 409)
    })

    test('should return 400 for invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/signup',
        payload: {
          username: 'invaliduser',
          email: 'invalid@example.com',
          password: 'weakpassword',
        },
      })

      assert.strictEqual(response.statusCode, 400)
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      assert.strictEqual(response.statusCode, 200)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.username, 'profileuser')
      assert.strictEqual(body.email, 'profile@example.com')
    })

    test('should return 401 for unauthenticated request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/profile',
      })

      assert.strictEqual(response.statusCode, 401)
    })
  })
})
