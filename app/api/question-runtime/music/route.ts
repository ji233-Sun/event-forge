import { generateInstrumentalMusic } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { r2Upload, r2KeyToMediaProxyUrl, dataUrlToBuffer } from '@/lib/r2'

const FIXED_DURATION_SECONDS = 30
const AUDIO_DOWNLOAD_TIMEOUT_MS = 600_000

async function resolveAudioBuffer(
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

  const {
    prompt,
    mood = 'neutral',
    tempo = 'moderate',
    instrumentation = 'mixed',
  } = body as {
    prompt?: unknown
    mood?: unknown
    tempo?: unknown
    instrumentation?: unknown
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return Response.json({ error: 'prompt is required.' }, { status: 400 })
  }

  try {
    const result = await generateInstrumentalMusic({
      prompt: prompt.trim(),
      durationSeconds: FIXED_DURATION_SECONDS,
      mood: typeof mood === 'string' ? mood : 'neutral',
      tempo: typeof tempo === 'string' ? tempo : 'moderate',
      instrumentation: typeof instrumentation === 'string' ? instrumentation : 'mixed',
    })
    const { buffer, contentType } = await resolveAudioBuffer(result.previewUrl, result.mediaType)
    const ext = contentType.split('/')[1]?.split(';')[0] ?? 'mp3'
    const key = `media/${session.user.id}/qr-${crypto.randomUUID()}.${ext}`
    await r2Upload(key, buffer, contentType)
    return Response.json({ audioUrl: r2KeyToMediaProxyUrl(key) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Music generation failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
