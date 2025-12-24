import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { NotFound } from './components/notFound'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: () => <NotFound />,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
