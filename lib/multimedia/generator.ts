import 'server-only'

import { generate, generateImage } from '@/lib/ai'
import type {
  PosterAspectRatio,
  MultimediaExperience,
  MultimediaModelPayload,
} from './types'
import { DEFAULT_POSTER_ASPECT_RATIO } from './types'

const DEFAULT_HASHTAGS = ['#EventForge', '#LiveEvent']

const POSTER_IMAGE_SIZE_BY_RATIO: Record<PosterAspectRatio, string> = {
  '16:9': '1536x864',
  '4:5': '1024x1280',
  '1:1': '1280x1280',
  '9:16': '864x1536',
}

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

export function resolvePosterAspectRatio(aspectRatio?: PosterAspectRatio): PosterAspectRatio {
  return aspectRatio ?? DEFAULT_POSTER_ASPECT_RATIO
}

function buildSystemPrompt(aspectRatio: PosterAspectRatio) {
  return [
    'You are the multimedia orchestrator for EventForge.',
    'Return strict JSON only. Do not wrap the response in markdown.',
    'All copy must be in English.',
    `Target poster aspect ratio: ${aspectRatio}.`,
    'Poster prompt must describe a real event poster composition, not a plain background image.',
    'Poster prompt should explicitly include: strong focal artwork, clear title zone, subtitle/date/venue info zone, and readable text-safe spacing.',
    'Return this shape:',
    '{"title":"","visualDirection":"","posterPrompt":"","caption":"","cta":"","hashtags":["#EventForge"]}',
    'Caption should be 2-4 energetic sentences with emoji.',
    'Poster prompt should be detailed enough for an image model.',
  ].join('\n')
}

export async function generatePosterAsset(
  prompt: string,
  aspectRatio: PosterAspectRatio,
) {
  const normalizedRatio = resolvePosterAspectRatio(aspectRatio)
  const posterResult = await generateImage(prompt, {
    n: 1,
    size: POSTER_IMAGE_SIZE_BY_RATIO[normalizedRatio],
  })
  const poster = posterResult.images[0]

  if (!poster) {
    throw new Error('The image model did not return a poster')
  }

  return {
    imageDataUrl: toDataUrl(poster),
    prompt,
    aspectRatio: normalizedRatio,
  }
}

export async function generateMultimediaExperience(
  brief: string,
  options: { aspectRatio?: PosterAspectRatio } = {},
): Promise<MultimediaExperience> {
  const normalizedBrief = brief.trim()
  const aspectRatio = resolvePosterAspectRatio(options.aspectRatio)

  const metadataResult = await generate('hard', normalizedBrief, {
    system: buildSystemPrompt(aspectRatio),
  })
  const metadata = parseModelPayload(metadataResult.text)
  const poster = await generatePosterAsset(metadata.posterPrompt, aspectRatio)

  return {
    brief: normalizedBrief,
    concept: {
      title: metadata.title,
      visualDirection: metadata.visualDirection,
    },
    poster: {
      alt: `${metadata.title} poster`,
      imageDataUrl: poster.imageDataUrl,
      prompt: poster.prompt,
      aspectRatio: poster.aspectRatio,
    },
    socialCopy: {
      caption: metadata.caption,
      cta: metadata.cta,
      hashtags: metadata.hashtags,
      shareText: buildShareText(metadata),
    },
  }
}
