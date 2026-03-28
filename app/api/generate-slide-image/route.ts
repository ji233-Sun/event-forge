import { generateImage } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { isPlainObject } from '@/lib/api-utils'

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

  if (typeof slideIndex !== 'number' || !Number.isInteger(slideIndex)) {
    return Response.json({ error: 'slideIndex is required' }, { status: 400 })
  }

  try {
    const { images } = await generateImage(imagePrompt.trim(), { size: '1920*1080' })
    const image = images[0]

    if (!image) {
      return Response.json({ error: 'Image generation returned no images' }, { status: 502 })
    }

    return Response.json({
      index: slideIndex,
      base64: image.base64,
      mediaType: image.mediaType,
    })
  } catch (error) {
    console.error('[generate-slide-image] failed:', error)
    return Response.json({ error: 'Image generation failed. Try again.' }, { status: 502 })
  }
}
