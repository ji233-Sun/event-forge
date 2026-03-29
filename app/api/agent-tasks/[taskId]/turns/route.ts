import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { buildAgentInstructions, EVENTFORGE_SKILL_URL } from '@/lib/agent-tasks/skill'
import { createAgentTaskTurn, getOpenTaskForUser } from '@/lib/agent-tasks/service'
import type { AgentTaskResourceKind } from '@/lib/agent-tasks/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { taskId } = await params
  const task = await getOpenTaskForUser(taskId, session.user.id)
  if (!task) {
    return Response.json({ error: 'Task not found.' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const payload = body as { feedback?: unknown }
  if (typeof payload.feedback !== 'string' || payload.feedback.trim().length === 0) {
    return Response.json({ error: 'feedback is required.' }, { status: 400 })
  }

  const turn = await createAgentTaskTurn({
    taskId,
    kind: 'iterate',
    requestPayload: {
      originalPrompt: task.originalPrompt,
      iterationFeedback: payload.feedback.trim(),
      currentDraft: task.latestDraft,
    },
    now: new Date(),
  })

  const agentReadUrl = `/api/agent-tasks/${taskId}/agent`
  const agentSubmitUrl = `/api/agent-tasks/${taskId}/agent/submission`

  return Response.json({
    taskId,
    turnId: turn.turnId,
    token: turn.token,
    tokenExpiresAt: turn.expiresAt.toISOString(),
    skillUrl: EVENTFORGE_SKILL_URL,
    agentReadUrl,
    agentSubmitUrl,
    agentInstructions: buildAgentInstructions({
      taskId,
      skillUrl: EVENTFORGE_SKILL_URL,
      readUrl: agentReadUrl,
      submitUrl: agentSubmitUrl,
      token: turn.token,
      resourceKind: task.resourceKind as AgentTaskResourceKind,
      turnKind: 'iterate',
    }),
  })
}
