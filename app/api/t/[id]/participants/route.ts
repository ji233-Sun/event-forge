import { db } from '@/lib/db'
import { minitool, minitoolParticipant } from '@/lib/db/auth-schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const tool = await db.query.minitool.findFirst({
    where: and(eq(minitool.id, id), eq(minitool.userId, session.user.id)),
    columns: { id: true },
  })
  if (!tool) return Response.json({ error: 'Not found' }, { status: 404 })

  const participants = await db.query.minitoolParticipant.findMany({
    where: eq(minitoolParticipant.minitoolId, id),
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
    columns: { visitorId: true, data: true, updatedAt: true },
  })

  return Response.json({ participants })
}
