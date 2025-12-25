import { Outlet, createFileRoute } from '@tanstack/react-router'
import { PublicHeader } from '@/components/public-header'

export const Route = createFileRoute('/public')({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
