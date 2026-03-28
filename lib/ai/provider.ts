import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'

if (!process.env.QWEN_API_KEY) {
  throw new Error('[lib/ai] QWEN_API_KEY is not set')
}

// Bailian (DashScope) OpenAI-compatible endpoint
export const qwenProvider = createOpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.QWEN_API_KEY,
})
