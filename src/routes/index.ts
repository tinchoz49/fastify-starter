import type { App } from '~/app'

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
    register(import('./health')),
    register(import('./posts')),
    register(import('./auth')),
  ])
}
