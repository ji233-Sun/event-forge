import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { saveAgentTaskForUser } from '@/lib/agent-tasks/service'

export async function POST(
  _: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  try {
    const { taskId } = await params
    const result = await saveAgentTaskForUser({
      taskId,
      userId: session.user.id,
    })

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Save failed.'
    return Response.json({ error: message }, { status: 400 })
  }
}
