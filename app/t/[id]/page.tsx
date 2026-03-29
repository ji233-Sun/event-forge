import { db } from '@/lib/db'
import { minitool } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import { PublicMinitoolClient } from './public-minitool-client'

export default async function PublicMinitoolPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const tool = await db.query.minitool.findFirst({
    where: eq(minitool.id, id),
    columns: { id: true, componentCode: true, isPublic: true },
  })

  // isPublic: false → friendly "not available" (no redirect, no 404 — avoids leaking existence)
  if (!tool || !tool.isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tool Not Available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This tool is not currently active or does not exist.
          </p>
        </div>
      </div>
    )
  }

  return <PublicMinitoolClient minitoolId={tool.id} componentCode={tool.componentCode} />
}
