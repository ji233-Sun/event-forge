import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { buildAgentInstructions, EVENTFORGE_SKILL_URL } from '@/lib/agent-tasks/skill'
import { createAgentTask, createAgentTaskTurn } from '@/lib/agent-tasks/service'
import type { AgentTaskTurnKind } from '@/lib/agent-tasks/types'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const payload = body as {
    resourceKind?: unknown
    prompt?: unknown
    existingEntityId?: unknown
    currentDraft?: unknown
    feedback?: unknown
    turnKind?: unknown
  }

  if (
    (payload.resourceKind !== 'question_type' && payload.resourceKind !== 'minitool') ||
    typeof payload.prompt !== 'string' ||
    payload.prompt.trim().length === 0
  ) {
    return Response.json({ error: 'resourceKind and prompt are required.' }, { status: 400 })
  }

  const prompt = payload.prompt.trim()
  const turnKind: AgentTaskTurnKind =
    payload.turnKind === 'iterate' ? 'iterate' : 'create'
  const feedback =
    typeof payload.feedback === 'string' && payload.feedback.trim().length > 0
      ? payload.feedback.trim()
      : null
  if (turnKind === 'iterate' && !feedback) {
    return Response.json({ error: 'feedback is required for iterate turns.' }, { status: 400 })
  }

  const currentDraft =
    payload.currentDraft && typeof payload.currentDraft === 'object'
      ? (payload.currentDraft as Record<string, unknown>)
      : null

  const task = await createAgentTask({
    userId: session.user.id,
    resourceKind: payload.resourceKind,
    originalPrompt: prompt,
    initialDraft: currentDraft,
    savedEntityId:
      typeof payload.existingEntityId === 'string' ? payload.existingEntityId : null,
  })
  const turn = await createAgentTaskTurn({
    taskId: task.id,
    kind: turnKind,
    requestPayload: {
      originalPrompt: prompt,
      iterationFeedback: feedback,
      currentDraft,
    },
    now: new Date(),
  })

  const agentReadUrl = `/api/agent-tasks/${task.id}/agent`
  const agentSubmitUrl = `/api/agent-tasks/${task.id}/agent/submission`

  return Response.json({
    taskId: task.id,
    turnId: turn.turnId,
    token: turn.token,
    tokenExpiresAt: turn.expiresAt.toISOString(),
    skillUrl: EVENTFORGE_SKILL_URL,
    agentReadUrl,
    agentSubmitUrl,
    agentInstructions: buildAgentInstructions({
      taskId: task.id,
      skillUrl: EVENTFORGE_SKILL_URL,
      readUrl: agentReadUrl,
      submitUrl: agentSubmitUrl,
      token: turn.token,
      resourceKind: task.resourceKind,
      turnKind,
    }),
  })
}
