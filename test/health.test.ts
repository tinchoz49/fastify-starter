import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import request from 'supertest'

import { createApp } from '~/app.js'

describe('Health API', () => {
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

  describe('GET /api/health', () => {
    test('should check application health', async () => {
      const res = await request(app.server)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')

      expect(res.body.status).toBe('ok')
      expect(res.body.timestamp).toBeDefined()
    })

    describe('database failure', () => {
      const failApp = createApp({
        env: {
          DATABASE: {
            HOST: '0.0.0.0',
            PORT: 5432,
            USER: 'postgres',
            PASSWORD: 'wrongpassword',
            NAME: 'db',
          },
          JWT: {
            SECRET: 'test',
          },
        },
      })

      beforeAll(async () => {
        await failApp.ready()
      })

      afterAll(async () => {
        await failApp.close()
      })

      test('should return status error', async () => {
        const res = await request(failApp.server)
          .get('/api/health')
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')

        expect(res.body.status).toBe('error')
      })
    })
  })
})
