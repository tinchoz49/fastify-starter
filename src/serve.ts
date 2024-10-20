import { createApp } from './app'

const app = createApp()

await app.listen({
  port: app.env.PORT,
  host: app.env.HOST,
})
