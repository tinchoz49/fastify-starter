import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { copycat, faker } from '@snaplet/copycat'
import { Argon2id } from 'oslo/password'

import * as schema from '~/db/schema'

let PASSWORD_HASH: string

function createRandomUser(...args: any[]) {
  return {
    username: copycat.username('foo' + args[1]),
    email: copycat.email('foo' + args[1]),
    passwordHash: PASSWORD_HASH,
  }
}

function createRandomPost() {
  return {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
  }
}

export default async function seed(db: PostgresJsDatabase<typeof schema>) {
  const argon2id = new Argon2id()
  PASSWORD_HASH = await argon2id.hash('P@22w0rd')

  const allUsers = await db.insert(schema.users).values(
    faker.helpers.multiple(createRandomUser, {
      count: 5,
    })
  ).returning({ id: schema.users.id })

  await db.insert(schema.posts).values(allUsers.flatMap(user =>
    faker.helpers.multiple(createRandomPost, {
      count: 5,
    }).map(post => ({ ...post, authorId: user.id }))
  ))
}
