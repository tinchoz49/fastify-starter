import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

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

  before(async () => {
    await app.ready()
  })

  after(async () => {
    await app.close()
  })

  test('GET /api/health - should check application health', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    })

    assert.equal(res.statusCode, 200)

    const body = await res.json()
    assert.equal(body.status, 'ok')
    assert.ok(Date.parse(body.timestamp), 'Timestamp should be a valid date string')
  })

  describe('Database failure', () => {
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

    after(async () => {
      await failApp.close()
    })

    test('GET /api/health - should return status error', async () => {
      const res = await failApp.inject({
        method: 'GET',
        url: '/api/health',
      })

      const body = await res.json()
      assert.equal(res.statusCode, 200)
      assert.equal(body.status, 'error')
    })
  })
})
