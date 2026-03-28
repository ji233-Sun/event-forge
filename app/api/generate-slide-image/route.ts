import { generateImage } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { isPlainObject } from '@/lib/api-utils'
import { r2Upload, r2KeyToProxyUrl } from '@/lib/r2'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { imagePrompt, slideIndex } = body as {
    imagePrompt?: string
    slideIndex?: number
  }

  if (typeof imagePrompt !== 'string' || imagePrompt.trim() === '') {
    return Response.json({ error: 'imagePrompt is required' }, { status: 400 })
  }

  if (typeof slideIndex !== 'number' || !Number.isInteger(slideIndex) || slideIndex < 0) {
    return Response.json({ error: 'slideIndex is required' }, { status: 400 })
  }

  const trimmedPrompt = imagePrompt.trim()

  try {
    const { images } = await generateImage(trimmedPrompt, { size: '1920*1080' })
    const image = images[0]

    if (!image) {
      return Response.json({ error: 'Image generation returned no images' }, { status: 502 })
    }

    // Upload to R2; key encodes userId for auth verification in the proxy route
    const ext = image.mediaType.split('/')[1] ?? 'png'
    const key = `slides/${session.user.id}/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(image.base64, 'base64')
    await r2Upload(key, buffer, image.mediaType)

    return Response.json({
      index: slideIndex,
      url: r2KeyToProxyUrl(key),
    })
  } catch (error) {
    console.error('[generate-slide-image] failed:', error)
    return Response.json({ error: 'Image generation failed. Try again.' }, { status: 502 })
  }
}
