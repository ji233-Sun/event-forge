import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { cancelAgentTaskForUser } from '@/lib/agent-tasks/service'

export async function POST(
  _: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { taskId } = await params
  await cancelAgentTaskForUser({
    taskId,
    userId: session.user.id,
  })

  return Response.json({ ok: true })
}
