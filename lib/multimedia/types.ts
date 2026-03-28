export type Soundtrack = {
  id: string
  title: string
  description: string
  previewUrl: string
  durationLabel: string
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
  soundtrack: Soundtrack
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
  soundtrackId: string
  caption: string
  cta: string
  hashtags: string[]
}
