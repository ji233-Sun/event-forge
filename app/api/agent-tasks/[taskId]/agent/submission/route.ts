import { parseGeneratedMinitoolResult } from '@/app/api/minitools/generate/route'
import { parseGeneratedCustomTypeResult } from '@/app/api/question-types/generate/route'
import { acceptAgentSubmission } from '@/lib/agent-tasks/service'

function getBearerToken(request: Request) {
  const value = request.headers.get('authorization')
  if (!value?.startsWith('Bearer ')) {
    return null
  }

  return value.slice('Bearer '.length)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const token = getBearerToken(request)
  if (!token) {
    return Response.json({ error: 'Task token required.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const payload = body as {
    resourceKind?: unknown
    result?: unknown
  }
  if (payload.resourceKind !== 'question_type' && payload.resourceKind !== 'minitool') {
    return Response.json({ error: 'resourceKind is required.' }, { status: 400 })
  }

  const { taskId } = await params

  try {
    const normalized =
      payload.resourceKind === 'question_type'
        ? parseGeneratedCustomTypeResult(JSON.stringify(payload.result))
        : parseGeneratedMinitoolResult(JSON.stringify(payload.result))

    await acceptAgentSubmission({
      taskId,
      token,
      resourceKind: payload.resourceKind,
      normalizedResult: normalized,
      now: new Date(),
    })

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submission failed.'
    return Response.json({ error: message }, { status: 400 })
  }
}
