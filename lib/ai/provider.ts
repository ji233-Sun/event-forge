import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'

const MISSING_QWEN_API_KEY_MESSAGE = '[lib/ai] QWEN_API_KEY is not set'

export const qwenCompatibleBaseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
export const qwenApiBaseURL = 'https://dashscope.aliyuncs.com/api/v1'

export function getQwenApiKey() {
  return process.env.QWEN_API_KEY?.trim() || 'missing-qwen-api-key'
}

export function assertQwenApiKey() {
  if (!process.env.QWEN_API_KEY?.trim()) {
    throw new Error(MISSING_QWEN_API_KEY_MESSAGE)
  }
}

// Bailian (DashScope) OpenAI-compatible endpoint
export const qwenProvider = createOpenAI({
  baseURL: qwenCompatibleBaseURL,
  apiKey: getQwenApiKey(),
})
