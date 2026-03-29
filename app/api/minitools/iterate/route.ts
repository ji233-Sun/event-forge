import { generateText } from 'ai'
import { getModel } from '@/lib/ai'
import { assertMinimaxApiKey } from '@/lib/ai/provider'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { GenerateMinitoolResult } from '@/lib/minitool-runtime/types'
import { SYSTEM_PROMPT, parseGeneratedMinitoolResult } from '../generate/route'

const ITERATION_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

ITERATION MODE — MANDATORY:
- You are revising an existing live event minitool, not generating a brand new concept.
- Use the original prompt as the product brief and the feedback as the change request.
- Preserve working interactions unless the feedback explicitly asks to remove or replace them.
- Fix reported bugs, improve UX, and return the FULL updated JSON object in the same schema.`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidCurrentResult(value: unknown): value is GenerateMinitoolResult {
  return (
    isRecord(value)
    && typeof value.suggestedName === 'string'
    && typeof value.componentCode === 'string'
    && typeof value.hostCode === 'string'
  )
}

export async function POST(request: Request) {
  assertMinimaxApiKey()

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

  const {
    originalPrompt,
    feedback,
    currentResult,
  } = body as {
    originalPrompt?: unknown
    feedback?: unknown
    currentResult?: unknown
  }

  if (typeof originalPrompt !== 'string' || originalPrompt.trim().length === 0) {
    return Response.json({ error: 'originalPrompt is required.' }, { status: 400 })
  }

  if (originalPrompt.length > 500) {
    return Response.json({ error: 'originalPrompt must be 500 characters or fewer.' }, { status: 400 })
  }

  if (typeof feedback !== 'string' || feedback.trim().length === 0) {
    return Response.json({ error: 'feedback is required.' }, { status: 400 })
  }

  if (feedback.length > 500) {
    return Response.json({ error: 'feedback must be 500 characters or fewer.' }, { status: 400 })
  }

  if (!isValidCurrentResult(currentResult)) {
    return Response.json({ error: 'currentResult is incomplete.' }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: getModel('code'),
      system: ITERATION_SYSTEM_PROMPT,
      prompt: [
        'Revise this live event minitool based on the current implementation.',
        `Original request:\n${originalPrompt.trim()}`,
        `Feedback to apply:\n${feedback.trim()}`,
        `Current result JSON:\n${JSON.stringify(currentResult, null, 2)}`,
        'Return the full revised JSON object with suggestedName, componentCode, and hostCode.',
      ].join('\n\n'),
    })

    return Response.json(parseGeneratedMinitoolResult(result.text))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Iteration failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
