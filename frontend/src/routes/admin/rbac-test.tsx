import { createFileRoute } from '@tanstack/react-router'
import { RbacTestDashboard } from '@/components/rbac-test-dashboard'

export const Route = createFileRoute('/admin/rbac-test')({
  component: RbacTestPage,
})

function RbacTestPage() {
  return <RbacTestDashboard />
}
