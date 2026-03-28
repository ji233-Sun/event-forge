import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getDashboardData } from './actions'
import { DashboardContent } from './dashboard-content'
import { IconPlus, IconLayoutDashboard } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const data = await getDashboardData()

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <IconLayoutDashboard size={24} className="text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your survey activity
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/surveys/new">
            <IconPlus size={16} />
            New Survey
          </Link>
        </Button>
      </div>

      {/* Main */}
      <DashboardContent data={data} />
    </div>
  )
}
