import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { createApp } from '~/app.js'

describe('Posts API', () => {
  const app = createApp({
    env: {
      DATABASE: {
        IN_MEMORY: true,
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

  before(async () => {
    await app.ready()

    const _user = await app.drizzle.db.query.users.findFirst()
    if (!_user) {
      throw new Error('No user found')
    }
    user = _user
    userToken = app.jwt.sign({ id: user.id, username: user.username, email: user.email })
  })

  after(async () => {
    await app.close()
  })

  describe('CRUD operations', () => {
    it('GET /api/posts - get all posts', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/posts',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      assert.equal(res.statusCode, 200)
      const body = await res.json()
      for (const post of body) {
        assert.equal(post.authorId, user.id)
      }
    })

    it('POST /api/posts - create a new post', async () => {
      const newPost = {
        title: 'New Post',
        content: 'This is a new post.',
      }

      const res = await app.inject({
        method: 'POST',
        url: '/api/posts',
        payload: newPost,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      assert.equal(res.statusCode, 201)
      const body = await res.json()
      assert.equal(body.title, newPost.title)
      assert.equal(body.content, newPost.content)
      assert.equal(body.authorId, user.id)

      // Store the new post's ID for later tests
      newPostId = body.id
    })

    it('GET /api/posts/:id - get a single post', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/posts/${newPostId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      assert.equal(res.statusCode, 200)
      const body = await res.json()
      assert.equal(body.id, newPostId)
      assert.equal(body.authorId, user.id)
    })

    it('PUT /api/posts/:id - update a post', async () => {
      const updatedPost = {
        title: 'Updated Post',
        content: 'This post has been updated.',
      }

      const res = await app.inject({
        method: 'PUT',
        url: `/api/posts/${newPostId}`,
        payload: updatedPost,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      assert.equal(res.statusCode, 200)
      const body = await res.json()
      assert.equal(body.title, updatedPost.title)
      assert.equal(body.content, updatedPost.content)
    })

    it('DELETE /api/posts/:id - delete a post', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/posts/${newPostId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      assert.equal(res.statusCode, 204)

      // Verify that the post has been deleted
      const getRes = await app.inject({
        method: 'GET',
        url: `/api/posts/${newPostId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })

      assert.equal(getRes.statusCode, 404)
    })
  })
})
