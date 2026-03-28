import { generate } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { isPlainObject } from '@/lib/api-utils'
import { headers } from 'next/headers'

type SlidePlan = {
  index: number
  title: string
  imagePrompt: string
}

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1].trim() : text.trim()
  return JSON.parse(raw)
}

const SYSTEM_PROMPT = `You are a presentation designer. Plan a visual image slide deck based on the event description.

Return ONLY a valid JSON object — no other text, no markdown fences, no explanation:
{
  "slides": [
    {
      "index": 0,
      "title": "Short title (2–5 words for navigation)",
      "imagePrompt": "Detailed visual image generation prompt in English"
    }
  ]
}

Rules:
- Generate between 6 and 10 slides (decide based on content complexity)
- slides[0] is always the cover/title slide
- Always include: cover, agenda/overview, 3–6 content slides, closing slide
- imagePrompt MUST be in English regardless of the input language
- imagePrompt must describe a professional 16:9 presentation slide image:
  * Background color/gradient (e.g. "dark navy blue background with subtle grid pattern")
  * Exact text to display on the slide (title, subtitle, bullet points, labels)
  * Visual theme matching the event (professional, tech, nature, creative, etc.)
  * Typography style (bold, clean, minimal, dramatic, etc.)
  * Decorative elements if appropriate (geometric shapes, gradients, icons as simple objects)
- title is short for the navigation strip only
- Do NOT include any text outside the JSON object`

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

  const { prompt } = body as { prompt?: string }

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  let slides: SlidePlan[]

  try {
    const { text, finishReason } = await generate(
      'medium',
      `Plan a visual image slide deck for the following event:\n\n${prompt.trim()}`,
      { system: SYSTEM_PROMPT },
    )

    if (String(finishReason) === 'length') {
      return Response.json(
        { error: 'Model output truncated. Please retry.' },
        { status: 502 },
      )
    }

    const parsed = extractJson(text)

    if (
      !isPlainObject(parsed) ||
      !Array.isArray((parsed as Record<string, unknown>).slides)
    ) {
      throw new Error('Model did not return a valid slides array')
    }

    slides = (parsed as { slides: SlidePlan[] }).slides
  } catch (error) {
    console.error('[generate-slide-plan] failed:', error)
    return Response.json({ error: 'AI generation failed. Try again.' }, { status: 502 })
  }

  if (slides.length < 6 || slides.length > 10) {
    return Response.json(
      { error: 'Model returned an invalid number of slides (expected 6–10). Please retry.' },
      { status: 502 },
    )
  }

  // Validate individual slide shape
  const invalidSlide = slides.find(
    (s) => typeof s.title !== 'string' || typeof s.imagePrompt !== 'string' || typeof s.index !== 'number',
  )
  if (invalidSlide) {
    return Response.json(
      { error: 'Model returned malformed slide data. Please retry.' },
      { status: 502 },
    )
  }

  return Response.json({ slides })
}
