import { createApp } from './app.js'

const app = createApp()

await app.listen({
  port: app.env.PORT,
  host: app.env.HOST,
})
