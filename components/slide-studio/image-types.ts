export type SlideStatus = 'pending' | 'generating' | 'done' | 'failed'

export type ImageSlideState = {
  index: number
  title: string
  imagePrompt: string
  status: SlideStatus
  url?: string
}
