import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'

const MISSING_QWEN_API_KEY_MESSAGE = '[lib/ai] QWEN_API_KEY is not set'
const MISSING_MINIMAX_API_KEY_MESSAGE = '[lib/ai] MINIMAX_API_KEY is not set'

export const qwenCompatibleBaseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
export const qwenApiBaseURL = 'https://dashscope.aliyuncs.com/api/v1'
export const minimaxApiBaseURL = process.env.MINIMAX_BASE_URL?.trim() || 'https://api.minimax.io'

export function getQwenApiKey() {
  return process.env.QWEN_API_KEY?.trim() || 'missing-qwen-api-key'
}

export function assertQwenApiKey() {
  if (!process.env.QWEN_API_KEY?.trim()) {
    throw new Error(MISSING_QWEN_API_KEY_MESSAGE)
  }
}

export function getMinimaxApiKey() {
  return process.env.MINIMAX_API_KEY?.trim() || 'missing-minimax-api-key'
}

export function assertMinimaxApiKey() {
  if (!process.env.MINIMAX_API_KEY?.trim()) {
    throw new Error(MISSING_MINIMAX_API_KEY_MESSAGE)
  }
}

export function getMinimaxMusicModel() {
  return process.env.MINIMAX_MUSIC_MODEL?.trim() || 'music-2.5+'
}

// Bailian (DashScope) OpenAI-compatible endpoint
export const qwenProvider = createOpenAI({
  baseURL: qwenCompatibleBaseURL,
  apiKey: getQwenApiKey(),
})

// MiniMax OpenAI-compatible endpoint
export const minimaxProvider = createOpenAI({
  baseURL: `${minimaxApiBaseURL}/v1`,
  apiKey: getMinimaxApiKey(),
})
