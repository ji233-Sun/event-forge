import { and, eq } from 'drizzle-orm'

import type { AgentTaskDraft, AgentTaskReadResponse } from './contracts'
import type { AgentTaskResourceKind, AgentTaskTurnKind } from './types'
import { getOutputContract } from './skill'
import { createTaskToken, isTaskTokenExpired, verifyTaskToken } from './token'
import { db } from '@/lib/db'
import { agentTask, agentTaskTurn, customQuestionType, minitool } from '@/lib/db/auth-schema'

const QUESTION_TYPE_RULES = [
  'No import statements.',
  'No unsupported TypeScript syntax.',
  'End code with render(...).',
  'UI text must be English.',
]

const MINITOOL_RULES = [
  'No import statements.',
  'No unsupported TypeScript syntax.',
  'End code with render(...).',
  'UI text must be English.',
  'Host view must aggregate participant data.',
]

function getSuggestedDraftName(draft: Record<string, unknown> | null | undefined) {
  return draft && typeof draft.suggestedName === 'string' ? draft.suggestedName : null
}

function getRulesForResource(resourceKind: AgentTaskResourceKind) {
  return resourceKind === 'question_type' ? QUESTION_TYPE_RULES : MINITOOL_RULES
}

async function getPendingTurn(taskId: string) {
  return db.query.agentTaskTurn.findFirst({
    where: and(eq(agentTaskTurn.taskId, taskId), eq(agentTaskTurn.status, 'pending')),
  })
}

export async function createAgentTask({
  userId,
  resourceKind,
  originalPrompt,
  initialDraft,
  savedEntityId,
}: {
  userId: string
  resourceKind: AgentTaskResourceKind
  originalPrompt: string
  initialDraft?: Record<string, unknown> | null
  savedEntityId?: string | null
}) {
  const id = crypto.randomUUID()

  await db.insert(agentTask).values({
    id,
    userId,
    resourceKind,
    originalPrompt,
    status: 'open',
    latestDraft: initialDraft ?? null,
    latestDraftName: getSuggestedDraftName(initialDraft),
    savedEntityId: savedEntityId ?? null,
    skillVersion: 'v1',
  })

  return { id, resourceKind, originalPrompt }
}

export async function createAgentTaskTurn({
  taskId,
  kind,
  requestPayload,
  now,
}: {
  taskId: string
  kind: 'create' | 'iterate'
  requestPayload: Record<string, unknown>
  now: Date
}) {
  const turnId = crypto.randomUUID()
  const { token, tokenHash, expiresAt } = await createTaskToken({ now, ttlMinutes: 30 })

  await db
    .update(agentTaskTurn)
    .set({ status: 'expired' })
    .where(and(eq(agentTaskTurn.taskId, taskId), eq(agentTaskTurn.status, 'pending')))

  await db.insert(agentTaskTurn).values({
    id: turnId,
    taskId,
    kind,
    status: 'pending',
    requestPayload,
    tokenHash,
    tokenExpiresAt: expiresAt,
    submittedResult: null,
    submittedAt: null,
  })

  return { turnId, token, expiresAt }
}

export async function saveAgentTaskDraft({
  taskId,
  draft,
}: {
  taskId: string
  draft: Record<string, unknown>
}) {
  await db
    .update(agentTask)
    .set({
      latestDraft: draft,
      latestDraftName: getSuggestedDraftName(draft),
    })
    .where(eq(agentTask.id, taskId))
}

export async function getOpenTaskForUser(taskId: string, userId: string) {
  return db.query.agentTask.findFirst({
    where: and(
      eq(agentTask.id, taskId),
      eq(agentTask.userId, userId),
      eq(agentTask.status, 'open'),
    ),
  })
}

export async function assertValidTurnToken({
  storedHash,
  token,
  expiresAt,
  now,
}: {
  storedHash: string
  token: string
  expiresAt: Date
  now: Date
}) {
  if (isTaskTokenExpired({ expiresAt, now })) {
    throw new Error('Task token expired.')
  }

  const valid = await verifyTaskToken(token, storedHash)
  if (!valid) {
    throw new Error('Invalid task token.')
  }
}

export async function markTaskSaved({
  taskId,
  savedEntityId,
}: {
  taskId: string
  savedEntityId: string
}) {
  await db
    .update(agentTask)
    .set({ status: 'saved', savedEntityId })
    .where(eq(agentTask.id, taskId))
}

export async function getTaskPayloadForToken({
  taskId,
  token,
  now,
}: {
  taskId: string
  token: string
  now: Date
}): Promise<AgentTaskReadResponse> {
  const task = await db.query.agentTask.findFirst({
    where: and(eq(agentTask.id, taskId), eq(agentTask.status, 'open')),
  })
  const turn = await getPendingTurn(taskId)

  if (!task || !turn) {
    throw new Error('Task turn not found.')
  }

  await assertValidTurnToken({
    storedHash: turn.tokenHash,
    token,
    expiresAt: turn.tokenExpiresAt,
    now,
  })

  const resourceKind = task.resourceKind as AgentTaskResourceKind

  return {
    task: {
      id: task.id,
      resourceKind,
      turnKind: turn.kind as AgentTaskTurnKind,
      skillVersion: 'v1',
    },
    brief: {
      originalPrompt: task.originalPrompt,
      iterationFeedback:
        typeof turn.requestPayload.iterationFeedback === 'string'
          ? turn.requestPayload.iterationFeedback
          : null,
      currentDraft: task.latestDraft as AgentTaskDraft | null,
    },
    outputContract: getOutputContract(resourceKind),
    rules: getRulesForResource(resourceKind),
  }
}

export async function acceptAgentSubmission({
  taskId,
  token,
  resourceKind,
  normalizedResult,
  now,
}: {
  taskId: string
  token: string
  resourceKind: AgentTaskResourceKind
  normalizedResult: Record<string, unknown>
  now: Date
}) {
  const task = await db.query.agentTask.findFirst({
    where: and(eq(agentTask.id, taskId), eq(agentTask.status, 'open')),
  })
  const turn = await getPendingTurn(taskId)

  if (!task || !turn) {
    throw new Error('Task turn not found.')
  }
  if (task.resourceKind !== resourceKind) {
    throw new Error('Task resource mismatch.')
  }

  await assertValidTurnToken({
    storedHash: turn.tokenHash,
    token,
    expiresAt: turn.tokenExpiresAt,
    now,
  })

  await db
    .update(agentTaskTurn)
    .set({
      status: 'submitted',
      submittedResult: normalizedResult,
      submittedAt: now,
    })
    .where(eq(agentTaskTurn.id, turn.id))

  await saveAgentTaskDraft({
    taskId,
    draft: normalizedResult,
  })
}

export async function saveAgentTaskForUser({
  taskId,
  userId,
}: {
  taskId: string
  userId: string
}) {
  const task = await db.query.agentTask.findFirst({
    where: and(eq(agentTask.id, taskId), eq(agentTask.userId, userId)),
  })

  if (!task || task.status !== 'open' || !task.latestDraft) {
    throw new Error('Task is not ready to save.')
  }

  if (task.resourceKind === 'question_type') {
    const draft = task.latestDraft as {
      suggestedName: string
      formCode: string
      displayCode: string
      answerSchema: Record<string, unknown>
    }
    const savedEntityId = task.savedEntityId ?? crypto.randomUUID()

    if (task.savedEntityId) {
      await db
        .update(customQuestionType)
        .set({
          name: draft.suggestedName,
          formCode: draft.formCode,
          displayCode: draft.displayCode,
          answerSchema: draft.answerSchema,
          creationMode: 'my_agent',
          agentTaskId: taskId,
        })
        .where(
          and(
            eq(customQuestionType.id, savedEntityId),
            eq(customQuestionType.userId, userId),
          ),
        )
    } else {
      await db.insert(customQuestionType).values({
        id: savedEntityId,
        userId,
        name: draft.suggestedName,
        description: null,
        prompt: task.originalPrompt,
        formCode: draft.formCode,
        displayCode: draft.displayCode,
        answerSchema: draft.answerSchema,
        creationMode: 'my_agent',
        agentTaskId: taskId,
      })
    }

    await markTaskSaved({ taskId, savedEntityId })

    return {
      savedEntityId,
      redirectTo: `/question-types/new?id=${savedEntityId}`,
    }
  }

  const draft = task.latestDraft as {
    suggestedName: string
    componentCode: string
    hostCode: string
  }
  const savedEntityId = task.savedEntityId ?? crypto.randomUUID()

  if (task.savedEntityId) {
    await db
      .update(minitool)
      .set({
        name: draft.suggestedName,
        componentCode: draft.componentCode,
        hostCode: draft.hostCode,
        creationMode: 'my_agent',
        agentTaskId: taskId,
      })
      .where(and(eq(minitool.id, savedEntityId), eq(minitool.userId, userId)))
  } else {
    await db.insert(minitool).values({
      id: savedEntityId,
      userId,
      name: draft.suggestedName,
      prompt: task.originalPrompt,
      componentCode: draft.componentCode,
      hostCode: draft.hostCode,
      isPublic: false,
      creationMode: 'my_agent',
      agentTaskId: taskId,
    })
  }

  await markTaskSaved({ taskId, savedEntityId })

  return {
    savedEntityId,
    redirectTo: `/minitools/new?id=${savedEntityId}`,
  }
}

export async function cancelAgentTaskForUser({
  taskId,
  userId,
}: {
  taskId: string
  userId: string
}) {
  await db
    .update(agentTask)
    .set({ status: 'cancelled' })
    .where(and(eq(agentTask.id, taskId), eq(agentTask.userId, userId), eq(agentTask.status, 'open')))
}
