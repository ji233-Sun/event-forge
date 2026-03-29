import type { LanguageModel } from 'ai'
import { qwenProvider, minimaxProvider } from './provider'

// Simple tasks: fast and cheap (default: qwen-turbo)
export const simpleModel: LanguageModel = qwenProvider(
  process.env.QWEN_MODEL_SIMPLE?.trim() || 'qwen-turbo',
)

// Medium tasks: balanced (default: qwen-plus)
export const mediumModel: LanguageModel = qwenProvider(
  process.env.QWEN_MODEL_MEDIUM?.trim() || 'qwen-plus',
)

// Hard tasks: most capable (default: qwen-max)
export const hardModel: LanguageModel = qwenProvider(
  process.env.QWEN_MODEL_HARD?.trim() || 'qwen-max',
)

// Code tasks: MiniMax code-specialized model (default: MiniMax-M2.7)
// Use .chat() to explicitly target /chat/completions — MiniMax does not implement /responses
export const codeModel: LanguageModel = minimaxProvider.chat(
  process.env.MINIMAX_MODEL_CODE?.trim() || 'MiniMax-M2.7',
)
