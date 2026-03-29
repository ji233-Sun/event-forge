import { getTaskPayloadForToken } from '@/lib/agent-tasks/service'

function getBearerToken(request: Request) {
  const value = request.headers.get('authorization')
  if (!value?.startsWith('Bearer ')) {
    return null
  }

  return value.slice('Bearer '.length)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const token = getBearerToken(request)
  if (!token) {
    return Response.json({ error: 'Task token required.' }, { status: 401 })
  }

  const { taskId } = await params

  try {
    const payload = await getTaskPayloadForToken({
      taskId,
      token,
      now: new Date(),
    })
    return Response.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read task.'
    return Response.json({ error: message }, { status: 401 })
  }
}
