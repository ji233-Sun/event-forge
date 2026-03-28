import type { LanguageModel } from 'ai'
import { qwenProvider } from './provider'

// Simple tasks: fast and cheap (default: qwen-turbo)
export const simpleModel: LanguageModel = qwenProvider(
  process.env.QWEN_MODEL_SIMPLE ?? 'qwen-turbo',
)

// Medium tasks: balanced (default: qwen-plus)
export const mediumModel: LanguageModel = qwenProvider(
  process.env.QWEN_MODEL_MEDIUM ?? 'qwen-plus',
)

// Hard tasks: most capable (default: qwen-max)
export const hardModel: LanguageModel = qwenProvider(
  process.env.QWEN_MODEL_HARD ?? 'qwen-max',
)
