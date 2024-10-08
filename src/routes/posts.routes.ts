import { Type } from '@sinclair/typebox'
import { and, eq } from 'drizzle-orm'

import type { App } from '~/app.js'

export const autoPrefix = '/posts'

export default async function postsRoutes(app: App) {
  const { PostSchema } = app.schemas
  const { db, entities: { posts } } = app.drizzle

  // Get all posts
  app.get('/', {
    onRequest: [
      app.auth([
        app.verifyToken,
      ]),
    ],
    schema: {
      description: 'Get all posts',
      tags: ['Posts'],
      security: [
        {
          BearerAuth: [],
        },
      ],
      response: {
        200: Type.Array(Type.Ref(PostSchema), {
          description: 'Successful response',
          title: 'GetAllPostsResponse',
        }),
        ...app.useErrors(['InternalServerError']),
      },
    },
  }, async (request) => {
    const { user } = request
    return await db.query.posts.findMany({
      where: (posts, { eq }) => eq(posts.authorId, user.id),
    })
  })

  // Create a new post
  app.post('/', {
    onRequest: [
      app.auth([
        app.verifyToken,
      ]),
    ],
    schema: {
      description: 'Create a new post',
      tags: ['Posts'],
      security: [
        {
          BearerAuth: [],
        },
      ],
      body: Type.Pick(PostSchema, ['title', 'content'], { title: 'CreatePostRequest' }),
      response: {
        201: Type.Ref(PostSchema, {
          description: 'Successfully created post',
          title: 'CreatePostResponse',
        }),
        ...app.useErrors(['ValidationError', 'NotFoundError', 'InternalServerError']),
      },
    },
  }, async (request, reply) => {
    const { title, content } = request.body
    const newPost = await db.insert(posts).values({
      title,
      content,
      authorId: request.user.id,
    }).returning()
    reply.code(201)
    return newPost[0]
  })

  // Get a single post by ID
  app.get('/:id', {
    onRequest: [
      app.auth([
        app.verifyToken,
      ]),
    ],
    schema: {
      description: 'Get a single post by ID',
      tags: ['Posts'],
      security: [
        {
          BearerAuth: [],
        },
      ],
      params: Type.Pick(PostSchema, ['id'], { title: 'GetPostByIdParams' }),
      response: {
        200: Type.Ref(PostSchema, {
          description: 'Successful response',
          title: 'GetPostByIdResponse',
        }),
        ...app.useErrors([
          'ValidationError',
          'NotFoundError',
          'InternalServerError',
        ]),
      },
    },
  }, async (request) => {
    const { id } = request.params
    const post = await db.query.posts.findFirst({
      where: (posts, { eq, and }) => and(eq(posts.id, id), eq(posts.authorId, request.user.id)),
    })
    if (!post) {
      throw new app.errors.NotFoundError('Post not found')
    }
    return post
  })

  // Update a post
  app.put('/:id', {
    onRequest: [
      app.auth([
        app.verifyToken,
      ]),
    ],
    schema: {
      description: 'Update a post by ID',
      tags: ['Posts'],
      security: [
        {
          BearerAuth: [],
        },
      ],
      params: Type.Pick(PostSchema, ['id'], { title: 'UpdatePostParams' }),
      body: Type.Pick(PostSchema, ['title', 'content'], { title: 'UpdatePostRequest' }),
      response: {
        200: Type.Ref(PostSchema, {
          description: 'Successfully updated post',
          title: 'UpdatePostResponse',
        }),
        ...app.useErrors([
          'ValidationError',
          'NotFoundError',
          'InternalServerError',
        ]),
      },
    },
  }, async (request) => {
    const { id } = request.params
    const { title, content } = request.body
    const updatedPost = await db
      .update(posts)
      .set({ title, content })
      .where(and(eq(posts.id, id), eq(posts.authorId, request.user.id)))
      .returning()
    if (!updatedPost.length) throw new app.errors.NotFoundError('Post not found')
    return updatedPost[0]
  })

  // Delete a post
  app.delete('/:id', {
    onRequest: [
      app.auth([
        app.verifyToken,
      ]),
    ],
    schema: {
      description: 'Delete a post by ID',
      tags: ['Posts'],
      security: [
        {
          BearerAuth: [],
        },
      ],
      params: Type.Pick(PostSchema, ['id'], { title: 'DeletePostParams' }),
      response: {
        204: Type.Null(),
        ...app.useErrors([
          'ValidationError',
          'NotFoundError',
          'InternalServerError',
        ]),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params
    const res = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.authorId, request.user.id)))
      .returning({ id: posts.id })
    if (!res.length) throw new app.errors.NotFoundError('Post not found')
    reply.code(204)
  })
}
