import { generateMultimediaExperience } from '@/lib/multimedia/generator'

type MultimediaRequestBody = {
  brief?: unknown
}

function getBrief(body: MultimediaRequestBody) {
  return typeof body.brief === 'string' ? body.brief.trim() : ''
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MultimediaRequestBody
    const brief = getBrief(body)

    if (!brief) {
      return Response.json(
        {
          error: 'Please provide an event brief before generating media.',
        },
        { status: 400 },
      )
    }

    const data = await generateMultimediaExperience(brief)

    return Response.json({ data })
  } catch (error) {
    console.error('[multimedia route] failed to generate media', error)

    return Response.json(
      {
        error: 'We could not generate multimedia assets right now.',
      },
      { status: 500 },
    )
  }
}
