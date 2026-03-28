import 'server-only'
import { generateImage as sdkGenerateImage } from 'ai'
import type { ImageModel } from 'ai'
import { assertQwenApiKey, qwenProvider } from './provider'

// Default: wanx2.6-t2i-turbo; override via QWEN_MODEL_IMAGE
export const imageModel: ImageModel = qwenProvider.image(
  process.env.QWEN_MODEL_IMAGE?.trim() || 'wanx2.6-t2i-turbo',
)

type GenerateImageOptions = Omit<
  Parameters<typeof sdkGenerateImage>[0],
  'model' | 'prompt'
>

// Convenience: image generation with full options passthrough (size, n, aspectRatio, seed, …)
export async function generateImage(
  prompt: string,
  options?: GenerateImageOptions,
) {
  assertQwenApiKey()
  return sdkGenerateImage({ model: imageModel, prompt, ...options })
}
