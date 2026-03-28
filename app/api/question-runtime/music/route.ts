import { generateInstrumentalMusic } from '@/lib/ai'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const {
    prompt,
    durationSeconds = 30,
    mood = 'neutral',
    tempo = 'moderate',
    instrumentation = 'mixed',
  } = body as {
    prompt?: unknown
    durationSeconds?: unknown
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
      durationSeconds: typeof durationSeconds === 'number' ? Math.min(Math.max(durationSeconds, 10), 60) : 30,
      mood: typeof mood === 'string' ? mood : 'neutral',
      tempo: typeof tempo === 'string' ? tempo : 'moderate',
      instrumentation: typeof instrumentation === 'string' ? instrumentation : 'mixed',
    })
    return Response.json({ audioUrl: result.previewUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Music generation failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
