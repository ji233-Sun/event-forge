import 'server-only'

import { generate, generateImage } from '@/lib/ai'
import { getSoundtrackById, SOUNDTRACKS } from './audio-catalog'
import type {
  MultimediaExperience,
  MultimediaModelPayload,
} from './types'

const DEFAULT_HASHTAGS = ['#EventForge', '#LiveEvent']

function unwrapJson(raw: string) {
  const trimmed = raw.trim()

  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  }

  return trimmed
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeHashtags(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_HASHTAGS
  }

  const hashtags = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return hashtags.length > 0 ? hashtags : DEFAULT_HASHTAGS
}

function parseModelPayload(raw: string): MultimediaModelPayload {
  const parsed = JSON.parse(unwrapJson(raw)) as Record<string, unknown>

  if (
    !isNonEmptyString(parsed.title) ||
    !isNonEmptyString(parsed.visualDirection) ||
    !isNonEmptyString(parsed.posterPrompt) ||
    !isNonEmptyString(parsed.caption) ||
    !isNonEmptyString(parsed.cta)
  ) {
    throw new Error('Incomplete multimedia metadata returned by the model')
  }

  return {
    title: parsed.title.trim(),
    visualDirection: parsed.visualDirection.trim(),
    posterPrompt: parsed.posterPrompt.trim(),
    soundtrackId: isNonEmptyString(parsed.soundtrackId)
      ? parsed.soundtrackId.trim()
      : SOUNDTRACKS[0].id,
    caption: parsed.caption.trim(),
    cta: parsed.cta.trim(),
    hashtags: normalizeHashtags(parsed.hashtags),
  }
}

function buildShareText(payload: Pick<MultimediaModelPayload, 'caption' | 'cta' | 'hashtags'>) {
  return [payload.caption, '', payload.cta, payload.hashtags.join(' ')].join('\n')
}

function toDataUrl(image: { base64: string; mediaType?: string }) {
  return `data:${image.mediaType ?? 'image/png'};base64,${image.base64}`
}

function buildSystemPrompt() {
  const soundtrackOptions = SOUNDTRACKS.map((track) => `${track.id}: ${track.description}`).join(
    '\n',
  )

  return [
    'You are the multimedia orchestrator for EventForge.',
    'Return strict JSON only. Do not wrap the response in markdown.',
    'All copy must be in English.',
    'Choose exactly one soundtrackId from this list:',
    soundtrackOptions,
    'Return this shape:',
    '{"title":"","visualDirection":"","posterPrompt":"","soundtrackId":"","caption":"","cta":"","hashtags":["#EventForge"]}',
    'Caption should be 2-4 energetic sentences with emoji.',
    'Poster prompt should be detailed enough for an image model.',
  ].join('\n')
}

export async function generateMultimediaExperience(
  brief: string,
): Promise<MultimediaExperience> {
  const normalizedBrief = brief.trim()

  const metadataResult = await generate('hard', normalizedBrief, {
    system: buildSystemPrompt(),
  })
  const metadata = parseModelPayload(metadataResult.text)

  const posterResult = await generateImage(metadata.posterPrompt, {
    n: 1,
    size: '1536x1024',
  })
  const poster = posterResult.images[0]

  if (!poster) {
    throw new Error('The image model did not return a poster')
  }

  const soundtrack = getSoundtrackById(metadata.soundtrackId)

  return {
    brief: normalizedBrief,
    concept: {
      title: metadata.title,
      visualDirection: metadata.visualDirection,
    },
    poster: {
      alt: `${metadata.title} poster`,
      imageDataUrl: toDataUrl(poster),
      prompt: metadata.posterPrompt,
    },
    soundtrack,
    socialCopy: {
      caption: metadata.caption,
      cta: metadata.cta,
      hashtags: metadata.hashtags,
      shareText: buildShareText(metadata),
    },
  }
}
