import { generateImage } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { r2Upload, r2KeyToMediaProxyUrl, dataUrlToBuffer } from '@/lib/r2'

const MAX_PROMPT_LENGTH = 1000

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

  const { prompt } = body as { prompt: unknown }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return Response.json({ error: 'prompt is required.' }, { status: 400 })
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json({ error: `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` }, { status: 400 })
  }

  try {
    const result = await generateImage(prompt.trim(), { size: '1024x1024' })
    const image = result.images[0]
    const { buffer, mediaType } = dataUrlToBuffer(`data:${image.mediaType};base64,${image.base64}`)
    const ext = mediaType.split('/')[1] ?? 'png'
    const key = `media/${session.user.id}/qr-${crypto.randomUUID()}.${ext}`
    await r2Upload(key, buffer, mediaType)
    return Response.json({ imageUrl: r2KeyToMediaProxyUrl(key) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
