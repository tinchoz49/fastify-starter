import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import request from 'supertest'

import { createApp } from '~/app.js'

describe('Posts API', () => {
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

  let newPostId: string
  let userToken: string
  let user: typeof app.drizzle.entities.users.$inferSelect

  beforeAll(async () => {
    await app.ready()

    const _user = await app.drizzle.db.query.users.findFirst()
    if (!_user) {
      throw new Error('No user found')
    }
    user = _user
    userToken = app.jwt.sign({ id: user.id, username: user.username, email: user.email })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/posts', () => {
    test('should return all posts', async () => {
      const res = await request(app.server)
        .get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect('Content-Type', /json/)

      const body = res.body
      for (const post of body) {
        expect(post.authorId).toBe(user.id)
      }
    })
  })

  describe('POST /api/posts', () => {
    test('should create a new post', async () => {
      const newPost = {
        title: 'New Post',
        content: 'This is a new post.',
      }

      const res = await request(app.server)
        .post('/api/posts')
        .send(newPost)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201)
        .expect('Content-Type', /json/)

      const body = res.body
      expect(body.title).toBe(newPost.title)
      expect(body.content).toBe(newPost.content)
      expect(body.authorId).toBe(user.id)

      // Store the new post's ID for later tests
      newPostId = body.id
    })
  })

  describe('GET /api/posts/:id', () => {
    test('should return a single post', async () => {
      const res = await request(app.server)
        .get(`/api/posts/${newPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect('Content-Type', /json/)

      const body = res.body
      expect(body.id).toBe(newPostId)
      expect(body.authorId).toBe(user.id)
    })
  })

  describe('PUT /api/posts/:id', () => {
    test('should update a post', async () => {
      const updatedPost = {
        title: 'Updated Post',
        content: 'This post has been updated.',
      }

      const res = await request(app.server)
        .put(`/api/posts/${newPostId}`)
        .send(updatedPost)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect('Content-Type', /json/)

      const body = res.body
      expect(body.title).toBe(updatedPost.title)
      expect(body.content).toBe(updatedPost.content)
    })
  })

  describe('DELETE /api/posts/:id', () => {
    test('should delete a post', async () => {
      await request(app.server)
        .delete(`/api/posts/${newPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204)

      // Verify that the post has been deleted
      await request(app.server)
        .get(`/api/posts/${newPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })
  })
})
