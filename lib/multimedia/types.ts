export type Soundtrack = {
  id: string
  title: string
  description: string
  previewUrl: string
  durationLabel: string
}

export const MUSIC_DURATION_OPTIONS = [15, 30, 45, 60] as const
export const MUSIC_MOOD_OPTIONS = ['uplifting', 'cinematic', 'calm', 'energetic'] as const
export const MUSIC_TEMPO_OPTIONS = ['slow', 'medium', 'fast'] as const
export const MUSIC_INSTRUMENTATION_OPTIONS = ['synth', 'piano', 'strings', 'ambient'] as const

export type MusicDurationSeconds = (typeof MUSIC_DURATION_OPTIONS)[number]
export type MusicMood = (typeof MUSIC_MOOD_OPTIONS)[number]
export type MusicTempo = (typeof MUSIC_TEMPO_OPTIONS)[number]
export type MusicInstrumentation = (typeof MUSIC_INSTRUMENTATION_OPTIONS)[number]

export type MusicGenerationControls = {
  durationSeconds: MusicDurationSeconds
  mood: MusicMood
  tempo: MusicTempo
  instrumentation: MusicInstrumentation
}

export const DEFAULT_MUSIC_GENERATION_CONTROLS: MusicGenerationControls = {
  durationSeconds: 30,
  mood: 'cinematic',
  tempo: 'medium',
  instrumentation: 'synth',
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
  brief: string
  conceptTitle: string
  visualDirection: string
  controls: MusicGenerationControls
}

export type MusicGenerationResponsePayload = {
  soundtrack: Soundtrack
}
