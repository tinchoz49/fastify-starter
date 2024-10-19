import type { App } from '~/app.js'

interface RouteModule {
  default: (app: App) => Promise<void>
  prefix?: string
}

export default async function routes(app: App) {
  const register = async <T extends Promise<RouteModule>>(module: T) => {
    const { default: routes, prefix } = await module
    return app.register(routes, { prefix })
  }

  return Promise.all([
    register(import('./health.js')),
    register(import('./posts.js')),
    register(import('./auth.js')),
  ])
}
