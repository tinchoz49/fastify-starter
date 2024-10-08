import { Type } from '@sinclair/typebox'

export const PostSchema = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Unique identifier for the post', examples: ['123e4567-e89b-12d3-a456-426614174000'] }),
  title: Type.String({ description: 'Title of the post', examples: ['My First Blog Post'] }),
  content: Type.String({ description: 'Content of the post', examples: ['This is the content of my first blog post.'] }),
  authorId: Type.String({ description: 'ID of the post author', examples: ['user-123'] }),
}, {
  $id: 'Post',
  title: 'Post',
  description: 'Post schema',
})
