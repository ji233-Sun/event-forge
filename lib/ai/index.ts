import { generateText, streamText } from 'ai'
import type { LanguageModel } from 'ai'
import { simpleModel, mediumModel, hardModel, codeModel } from './models'
import { assertQwenApiKey, assertMinimaxApiKey } from './provider'

// Re-export model instances for callers that want direct SDK access
export { simpleModel, mediumModel, hardModel, codeModel }

// Task complexity tier
export type Tier = 'simple' | 'medium' | 'hard' | 'code'

const TIER_MODELS: Record<Tier, LanguageModel> = {
  simple: simpleModel,
  medium: mediumModel,
  hard: hardModel,
  code: codeModel,
}

const TIER_ASSERTIONS: Record<Tier, () => void> = {
  simple: assertQwenApiKey,
  medium: assertQwenApiKey,
  hard: assertQwenApiKey,
  code: assertMinimaxApiKey,
}

// Get model instance by tier
export function getModel(tier: Tier): LanguageModel {
  return TIER_MODELS[tier]
}

type GenerateOptions = Omit<Parameters<typeof generateText>[0], 'model' | 'prompt' | 'messages'>
type StreamOptions = Omit<Parameters<typeof streamText>[0], 'model' | 'prompt' | 'messages'>

// Convenience: non-streaming text generation
export async function generate(
  tier: Tier,
  prompt: string,
  options?: GenerateOptions,
) {
  TIER_ASSERTIONS[tier]()

  const params: Parameters<typeof generateText>[0] = {
    model: TIER_MODELS[tier],
    prompt,
    ...options,
  }
  return generateText(params)
}

// Convenience: streaming text generation
export function stream(
  tier: Tier,
  prompt: string,
  options?: StreamOptions,
) {
  TIER_ASSERTIONS[tier]()

  const params: Parameters<typeof streamText>[0] = {
    model: TIER_MODELS[tier],
    prompt,
    ...options,
  }
  return streamText(params)
}

export { imageModel, generateImage } from './image'
export { generateInstrumentalMusic, generateMusic } from './music'
