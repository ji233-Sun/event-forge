import { auth } from '@/lib/auth'
import { generateMultimediaExperience } from '@/lib/multimedia/generator'

type MultimediaRequestBody = {
  brief?: unknown
}

function getBrief(body: MultimediaRequestBody) {
  return typeof body.brief === 'string' ? body.brief.trim() : ''
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let brief: string
  try {
    const body = (await request.json()) as MultimediaRequestBody
    brief = getBrief(body)
  } catch {
    return Response.json({ error: 'Malformed JSON.' }, { status: 400 })
  }

  if (!brief) {
    return Response.json(
      { error: 'Please provide an event brief before generating media.' },
      { status: 400 },
    )
  }

  try {
    const data = await generateMultimediaExperience(brief)
    return Response.json({ data })
  } catch (error) {
    console.error('[multimedia route] failed to generate media', error)
    return Response.json(
      { error: 'We could not generate multimedia assets right now.' },
      { status: 500 },
    )
  }
}
