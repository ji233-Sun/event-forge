import { and, eq, sql } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mediaGeneration } from '@/lib/db/auth-schema'
import { generateMusic } from '@/lib/ai'
import {
  type MusicGenerationResponsePayload,
  type Soundtrack,
} from '@/lib/multimedia/types'
import { r2Upload, r2KeyToMediaProxyUrl, dataUrlToBuffer } from '@/lib/r2'

const AUDIO_DOWNLOAD_TIMEOUT_MS = 600_000

async function fetchAudioBuffer(
  previewUrl: string,
  fallbackMediaType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (previewUrl.startsWith('data:')) {
    const { buffer, mediaType } = dataUrlToBuffer(previewUrl)
    return { buffer, contentType: mediaType }
  }
  // External URL (e.g. MiniMax CDN) — download and forward to R2
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AUDIO_DOWNLOAD_TIMEOUT_MS)
  try {
    const res = await fetch(previewUrl, { signal: controller.signal })
    if (!res.ok) throw new Error(`Failed to download audio from provider: ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    return { buffer: Buffer.from(arrayBuffer), contentType: fallbackMediaType }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Audio download timed out after ${AUDIO_DOWNLOAD_TIMEOUT_MS / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

type MusicRequestBody = {
  prompt?: unknown
  withLyrics?: unknown
  parentId?: unknown
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function buildDurationLabel(durationMs: number | null) {
  if (typeof durationMs === 'number' && durationMs > 0) {
    return `${Math.max(1, Math.round(durationMs / 1000))}s`
  }
  return null
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let prompt: string
  let withLyrics: boolean
  let parentId: string | null = null

  try {
    const body = (await request.json()) as MusicRequestBody
    if (!isNonEmptyString(body.prompt)) {
      return Response.json(
        { error: 'Please provide a music prompt.' },
        { status: 400 },
      )
    }
    prompt = body.prompt.trim()
    withLyrics = body.withLyrics === true
    parentId = isNonEmptyString(body.parentId) ? body.parentId.trim() : null
  } catch {
    return Response.json({ error: 'Malformed JSON.' }, { status: 400 })
  }

  try {
    const generated = await generateMusic({ prompt, withLyrics })

    // Upload audio to R2; replace data URL / external URL with proxy URL
    const { buffer: audioBuffer, contentType: audioContentType } = await fetchAudioBuffer(
      generated.previewUrl,
      generated.mediaType,
    )
    const audioExt = generated.mediaType.split('/')[1]?.split(';')[0] ?? 'mp3'
    const audioKey = `media/${session.user.id}/${crypto.randomUUID()}.${audioExt}`
    await r2Upload(audioKey, audioBuffer, audioContentType)

    const durationLabel = buildDurationLabel(generated.durationMs) ?? (withLyrics ? 'Song' : 'Instrumental')

    const soundtrack: Soundtrack = {
      id: `minimax-${crypto.randomUUID()}`,
      title: withLyrics ? 'Generated Song' : 'Generated Instrumental',
      description: prompt,
      previewUrl: r2KeyToMediaProxyUrl(audioKey),
      durationLabel,
      ...(generated.lyrics ? { lyrics: generated.lyrics } : {}),
    }

    // Persist soundtrack URL into the parent media generation record
    if (parentId) {
      try {
        await db
          .update(mediaGeneration)
          .set({
            result: sql`${mediaGeneration.result} || ${JSON.stringify({ soundtrack })}::jsonb`,
          })
          .where(
            and(
              eq(mediaGeneration.id, parentId),
              eq(mediaGeneration.userId, session.user.id),
            ),
          )
      } catch (persistError) {
        console.error('[multimedia/music route] failed to persist soundtrack', persistError)
      }
    }

    return Response.json({ soundtrack } satisfies MusicGenerationResponsePayload)
  } catch (error) {
    console.error('[multimedia/music route] failed to generate music', error)
    return Response.json(
      { error: 'We could not generate music right now. Please try again.' },
      { status: 500 },
    )
  }
}
