import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mediaGeneration } from '@/lib/db/auth-schema'
import { generateMultimediaExperience } from '@/lib/multimedia/generator'
import {
  DEFAULT_POSTER_ASPECT_RATIO,
  POSTER_ASPECT_RATIO_OPTIONS,
  type MultimediaExperience,
  type PosterAspectRatio,
} from '@/lib/multimedia/types'
import { r2Upload, r2KeyToMediaProxyUrl, dataUrlToBuffer } from '@/lib/r2'

type MultimediaRequestBody = {
  brief?: unknown
  aspectRatio?: unknown
}

function getBrief(body: MultimediaRequestBody) {
  return typeof body.brief === 'string' ? body.brief.trim() : ''
}

function getAspectRatio(body: MultimediaRequestBody): PosterAspectRatio {
  const raw = body.aspectRatio
  if (POSTER_ASPECT_RATIO_OPTIONS.some((option) => option === raw)) {
    return raw as PosterAspectRatio
  }

  return DEFAULT_POSTER_ASPECT_RATIO
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let brief: string
  let aspectRatio: PosterAspectRatio
  try {
    const body = (await request.json()) as MultimediaRequestBody
    brief = getBrief(body)
    aspectRatio = getAspectRatio(body)
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
    const generated = await generateMultimediaExperience(brief, { aspectRatio })

    // Upload poster image to R2; replace data URL with proxy URL
    const { buffer: imgBuffer, mediaType: imgMediaType } = dataUrlToBuffer(generated.poster.imageDataUrl)
    const imgExt = imgMediaType.split('/')[1] ?? 'png'
    const imgKey = `media/${session.user.id}/${crypto.randomUUID()}.${imgExt}`
    await r2Upload(imgKey, imgBuffer, imgMediaType)

    const data: MultimediaExperience = {
      ...generated,
      poster: { ...generated.poster, imageDataUrl: r2KeyToMediaProxyUrl(imgKey) },
    }

    const recordId = crypto.randomUUID()
    let persistedId: string | null = null
    try {
      await db.insert(mediaGeneration).values({
        id: recordId,
        userId: session.user.id,
        brief,
        result: data,
      })
      persistedId = recordId
    } catch (persistError) {
      console.error('[multimedia route] failed to persist media history', persistError)
    }

    return Response.json({ data, id: persistedId })
  } catch (error) {
    console.error('[multimedia route] failed to generate media', error)
    return Response.json(
      { error: 'We could not generate multimedia assets right now.' },
      { status: 500 },
    )
  }
}
