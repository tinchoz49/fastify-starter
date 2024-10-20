import { createApp } from './app'

const app = createApp()

app.listen({
  port: app.env.PORT,
  host: app.env.HOST,
})
