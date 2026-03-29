import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { getOpenTaskForUser } from '@/lib/agent-tasks/service'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { taskId } = await params
  const task = await getOpenTaskForUser(taskId, session.user.id)

  if (!task) {
    return Response.json({ error: 'Not found.' }, { status: 404 })
  }

  return Response.json(task)
}
