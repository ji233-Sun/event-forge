import { auth } from '@/lib/auth'
import { generateInstrumentalMusic } from '@/lib/ai'
import {
  MUSIC_DURATION_OPTIONS,
  MUSIC_INSTRUMENTATION_OPTIONS,
  MUSIC_MOOD_OPTIONS,
  MUSIC_TEMPO_OPTIONS,
  type MusicGenerationControls,
  type MusicGenerationRequestPayload,
  type MusicGenerationResponsePayload,
} from '@/lib/multimedia/types'

type MusicRequestBody = {
  brief?: unknown
  conceptTitle?: unknown
  visualDirection?: unknown
  controls?: unknown
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOneOf<T extends readonly string[] | readonly number[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return options.some((option) => option === value)
}

function parseControls(value: unknown): MusicGenerationControls | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const raw = value as Record<string, unknown>
  const durationSeconds = raw.durationSeconds
  const mood = raw.mood
  const tempo = raw.tempo
  const instrumentation = raw.instrumentation

  if (!isOneOf(durationSeconds, MUSIC_DURATION_OPTIONS)) {
    return null
  }

  if (!isOneOf(mood, MUSIC_MOOD_OPTIONS)) {
    return null
  }

  if (!isOneOf(tempo, MUSIC_TEMPO_OPTIONS)) {
    return null
  }

  if (!isOneOf(instrumentation, MUSIC_INSTRUMENTATION_OPTIONS)) {
    return null
  }

  return {
    durationSeconds,
    mood,
    tempo,
    instrumentation,
  }
}

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function buildPrompt(payload: MusicGenerationRequestPayload) {
  return [
    `Event brief: ${payload.brief}`,
    `Poster title: ${payload.conceptTitle}`,
    `Poster direction: ${payload.visualDirection}`,
    'Generate a coherent soundtrack for this visual direction.',
  ].join(' ')
}

function buildDescription(payload: MusicGenerationRequestPayload) {
  const mood = payload.controls.mood
  const tempo = payload.controls.tempo
  const instrumentation = payload.controls.instrumentation

  return `${toTitle(mood)} ${tempo} instrumental using ${instrumentation}-led textures, aligned with the generated poster direction.`
}

function buildDurationLabel(durationMs: number | null, fallbackSeconds: number) {
  if (typeof durationMs === 'number' && durationMs > 0) {
    return `${Math.max(1, Math.round(durationMs / 1000))}s instrumental`
  }

  return `${fallbackSeconds}s instrumental`
}

function parseRequestBody(body: MusicRequestBody): MusicGenerationRequestPayload | null {
  if (!isNonEmptyString(body.brief)) {
    return null
  }

  if (!isNonEmptyString(body.conceptTitle)) {
    return null
  }

  if (!isNonEmptyString(body.visualDirection)) {
    return null
  }

  const controls = parseControls(body.controls)
  if (!controls) {
    return null
  }

  return {
    brief: body.brief.trim(),
    conceptTitle: body.conceptTitle.trim(),
    visualDirection: body.visualDirection.trim(),
    controls,
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let payload: MusicGenerationRequestPayload | null = null

  try {
    const body = (await request.json()) as MusicRequestBody
    payload = parseRequestBody(body)
  } catch {
    return Response.json({ error: 'Malformed JSON.' }, { status: 400 })
  }

  if (!payload) {
    return Response.json(
      {
        error:
          'Invalid music generation input. Please provide brief, poster direction, and valid controls.',
      },
      { status: 400 },
    )
  }

  try {
    const generated = await generateInstrumentalMusic({
      prompt: buildPrompt(payload),
      durationSeconds: payload.controls.durationSeconds,
      mood: payload.controls.mood,
      tempo: payload.controls.tempo,
      instrumentation: payload.controls.instrumentation,
    })

    const soundtrack: MusicGenerationResponsePayload['soundtrack'] = {
      id: `minimax-${crypto.randomUUID()}`,
      title: `${toTitle(payload.controls.mood)} ${toTitle(payload.controls.instrumentation)} Instrumental`,
      description: buildDescription(payload),
      previewUrl: generated.previewUrl,
      durationLabel: buildDurationLabel(generated.durationMs, payload.controls.durationSeconds),
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
