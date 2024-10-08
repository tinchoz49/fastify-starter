import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.js',
  out: './migrations',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
})
