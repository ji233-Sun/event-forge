import { generateImage } from '@/lib/ai'

const MAX_PROMPT_LENGTH = 1000

export async function POST(request: Request) {
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
    return Response.json({
      imageUrl: `data:${image.mediaType};base64,${image.base64}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
