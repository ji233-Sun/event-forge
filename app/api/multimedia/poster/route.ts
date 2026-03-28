import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mediaGeneration, mediaGenerationVariant } from '@/lib/db/auth-schema'
import { generatePosterAsset, resolvePosterAspectRatio } from '@/lib/multimedia/generator'
import {
  DEFAULT_POSTER_ASPECT_RATIO,
  POSTER_ASPECT_RATIO_OPTIONS,
  type MultimediaExperience,
  type PosterAspectRatio,
  type PosterRegenerateRequestPayload,
  type PosterRegenerateResponsePayload,
} from '@/lib/multimedia/types'

type PosterRequestBody = {
  parentId?: unknown
  brief?: unknown
  conceptTitle?: unknown
  visualDirection?: unknown
  prompt?: unknown
  aspectRatio?: unknown
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function parseAspectRatio(value: unknown): PosterAspectRatio {
  if (POSTER_ASPECT_RATIO_OPTIONS.some((option) => option === value)) {
    return value as PosterAspectRatio
  }

  return DEFAULT_POSTER_ASPECT_RATIO
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: PosterRequestBody
  try {
    body = (await request.json()) as PosterRequestBody
  } catch {
    return Response.json({ error: 'Malformed JSON.' }, { status: 400 })
  }

  const parentId = asNonEmptyString(body.parentId)
  let source: MultimediaExperience | null = null

  if (parentId) {
    const [parentRecord] = await db
      .select()
      .from(mediaGeneration)
      .where(
        and(
          eq(mediaGeneration.id, parentId),
          eq(mediaGeneration.userId, session.user.id),
        ),
      )
      .limit(1)

    if (!parentRecord) {
      return Response.json({ error: 'Media record not found.' }, { status: 404 })
    }

    source = parentRecord.result as MultimediaExperience
  }

  const brief = asNonEmptyString(body.brief) ?? source?.brief ?? null
  const conceptTitle = asNonEmptyString(body.conceptTitle) ?? source?.concept.title ?? null
  const visualDirection =
    asNonEmptyString(body.visualDirection) ?? source?.concept.visualDirection ?? null
  const prompt = asNonEmptyString(body.prompt) ?? source?.poster.prompt ?? null
  const aspectRatio = resolvePosterAspectRatio(
    parseAspectRatio(body.aspectRatio ?? source?.poster.aspectRatio),
  )

  if (!brief || !conceptTitle || !visualDirection || !prompt) {
    return Response.json(
      {
        error:
          'Invalid poster regenerate payload. brief, conceptTitle, visualDirection, and prompt are required.',
      },
      { status: 400 },
    )
  }

  try {
    const poster = await generatePosterAsset(prompt, aspectRatio)
    const variantId = crypto.randomUUID()

    const variant: PosterRegenerateResponsePayload['variant'] = {
      id: variantId,
      parentId,
      imageDataUrl: poster.imageDataUrl,
      prompt: poster.prompt,
      aspectRatio: poster.aspectRatio,
      createdAt: new Date().toISOString(),
    }

    let persisted = false
    if (parentId) {
      try {
        await db.insert(mediaGenerationVariant).values({
          id: variantId,
          parentId,
          userId: session.user.id,
          posterPrompt: prompt,
          aspectRatio,
          imageDataUrl: poster.imageDataUrl,
        })
        persisted = true
      } catch (persistError) {
        console.error('[multimedia/poster route] failed to persist poster variant', persistError)
      }
    }

    return Response.json({ variant, persisted } satisfies PosterRegenerateResponsePayload)
  } catch (error) {
    console.error('[multimedia/poster route] failed to regenerate poster', error)
    return Response.json(
      { error: 'We could not regenerate the poster right now. Please try again.' },
      { status: 500 },
    )
  }
}
