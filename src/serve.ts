import { createApp } from './app.js'

const app = createApp({
  env: {
    DATABASE: {
      RUN_IN_MEMORY: true,
    },
  },
})

await app.listen({
  port: app.env.PORT,
  host: app.env.HOST,
})
