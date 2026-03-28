export type SlideStatus = 'pending' | 'done' | 'failed'

export type ImageSlideState = {
  index: number
  title: string
  imagePrompt: string
  status: SlideStatus
  base64?: string
  mediaType?: string
}
