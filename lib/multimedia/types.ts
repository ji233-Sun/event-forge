export type Soundtrack = {
  id: string
  title: string
  description: string
  previewUrl: string
  durationLabel: string
  lyrics?: string
}

export const POSTER_ASPECT_RATIO_OPTIONS = ['16:9', '4:5', '1:1', '9:16'] as const
export type PosterAspectRatio = (typeof POSTER_ASPECT_RATIO_OPTIONS)[number]
export const DEFAULT_POSTER_ASPECT_RATIO: PosterAspectRatio = '16:9'

export type PosterVariant = {
  id: string
  parentId: string | null
  imageDataUrl: string
  prompt: string
  aspectRatio: PosterAspectRatio
  createdAt: string
}


export type MultimediaExperience = {
  brief: string
  concept: {
    title: string
    visualDirection: string
  }
  poster: {
    alt: string
    imageDataUrl: string
    prompt: string
    aspectRatio?: PosterAspectRatio
  }
  // Optional for backward compatibility with historical records.
  soundtrack?: Soundtrack
  socialCopy: {
    caption: string
    cta: string
    hashtags: string[]
    shareText: string
  }
}

export type MultimediaModelPayload = {
  title: string
  visualDirection: string
  posterPrompt: string
  caption: string
  cta: string
  hashtags: string[]
}

export type MusicGenerationRequestPayload = {
  prompt: string
  withLyrics: boolean
}

export type MusicGenerationResponsePayload = {
  soundtrack: Soundtrack
}

export type PosterRegenerateRequestPayload = {
  parentId?: string | null
  brief: string
  conceptTitle: string
  visualDirection: string
  prompt: string
  aspectRatio: PosterAspectRatio
}

export type PosterRegenerateResponsePayload = {
  variant: PosterVariant
  persisted: boolean
}
