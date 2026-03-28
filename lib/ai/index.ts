import { generateText, streamText } from 'ai'
import type { LanguageModel } from 'ai'
import { simpleModel, mediumModel, hardModel } from './models'

// Re-export model instances for callers that want direct SDK access
export { simpleModel, mediumModel, hardModel }

// Task complexity tier
export type Tier = 'simple' | 'medium' | 'hard'

const TIER_MODELS: Record<Tier, LanguageModel> = {
  simple: simpleModel,
  medium: mediumModel,
  hard: hardModel,
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
  const params: Parameters<typeof streamText>[0] = {
    model: TIER_MODELS[tier],
    prompt,
    ...options,
  }
  return streamText(params)
}
