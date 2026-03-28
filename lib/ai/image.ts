import 'server-only'

import { Buffer } from 'node:buffer'
import {
  assertQwenApiKey,
  getQwenApiKey,
  qwenApiBaseURL,
} from './provider'

const DEFAULT_IMAGE_MODEL = 'wan2.6-t2i'
const LEGACY_IMAGE_MODEL_ALIASES: Record<string, string> = {
  'wanx2.6-t2i-turbo': DEFAULT_IMAGE_MODEL,
}
const DEFAULT_WAN_IMAGE_SIZE = '1280*1280'
const DEFAULT_QWEN_IMAGE_SIZE = '2048*2048'
const MAX_WAN_DIMENSION = 1440
const MAX_WAN_PIXELS = MAX_WAN_DIMENSION * MAX_WAN_DIMENSION
const TASK_POLL_INTERVAL_MS = 3_000
const TASK_TIMEOUT_MS = 120_000
const FETCH_TIMEOUT_MS = 30_000
const VALID_IMAGE_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

type GeneratedImage = {
  base64: string
  mediaType: string
  uint8Array: Uint8Array
}

type GenerateImageResult = {
  images: GeneratedImage[]
}

type GenerateImageOptions = {
  n?: number
  negativePrompt?: string
  promptExtend?: boolean
  seed?: number
  size?: string
  watermark?: boolean
}

type DashScopeTaskResult = {
  code?: string
  message?: string
  url?: string
}

type DashScopeChoiceContentItem = {
  image?: string
}

type DashScopeImageResponse = {
  code?: string
  message?: string
  output?: {
    choices?: Array<{
      message?: {
        content?: DashScopeChoiceContentItem[]
      }
    }>
    results?: DashScopeTaskResult[]
    task_id?: string
    task_status?: string
  }
}

function normalizeImageModel(modelId?: string) {
  const normalized = modelId?.trim()

  if (!normalized) {
    return DEFAULT_IMAGE_MODEL
  }

  return LEGACY_IMAGE_MODEL_ALIASES[normalized] ?? normalized
}

function isQwenImageModel(modelId: string) {
  return modelId.startsWith('qwen-image')
}

function normalizeSize(modelId: string, size?: string) {
  if (!size) {
    return isQwenImageModel(modelId)
      ? DEFAULT_QWEN_IMAGE_SIZE
      : DEFAULT_WAN_IMAGE_SIZE
  }

  const match = size.trim().match(/^(\d+)\s*[x*]\s*(\d+)$/i)
  if (!match) {
    return size
  }

  let width = Number(match[1])
  let height = Number(match[2])

  if (isQwenImageModel(modelId)) {
    return `${width}*${height}`
  }

  const scale = Math.min(
    1,
    MAX_WAN_DIMENSION / width,
    MAX_WAN_DIMENSION / height,
    Math.sqrt(MAX_WAN_PIXELS / (width * height)),
  )

  width = Math.max(1, Math.floor(width * scale))
  height = Math.max(1, Math.floor(height * scale))

  return `${width}*${height}`
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function buildHeaders(includeAsyncHeader: boolean) {
  return {
    Authorization: `Bearer ${getQwenApiKey()}`,
    'Content-Type': 'application/json',
    ...(includeAsyncHeader ? { 'X-DashScope-Async': 'enable' } : {}),
  }
}

function buildRequestBody(
  modelId: string,
  prompt: string,
  options: GenerateImageOptions,
) {
  return {
    model: modelId,
    input: {
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
    },
    parameters: {
      n: options.n ?? 1,
      prompt_extend: options.promptExtend ?? true,
      size: normalizeSize(modelId, options.size),
      watermark: options.watermark ?? false,
      ...(options.negativePrompt
        ? { negative_prompt: options.negativePrompt }
        : {}),
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
    },
  }
}

async function readJsonResponse(
  response: Response,
  context: string,
): Promise<DashScopeImageResponse> {
  const text = await response.text()
  const payload = text ? (JSON.parse(text) as DashScopeImageResponse) : {}

  if (!response.ok) {
    const errorMessage =
      payload.message ||
      payload.output?.results?.find((result) => result.message)?.message ||
      `${response.status} ${response.statusText}`.trim()

    throw new Error(`DashScope ${context} failed: ${errorMessage}`)
  }

  return payload
}

function extractImageUrls(payload: DashScopeImageResponse) {
  const urlsFromResults =
    payload.output?.results
      ?.flatMap((result) => (typeof result.url === 'string' ? [result.url] : []))
      ?? []

  if (urlsFromResults.length > 0) {
    return urlsFromResults
  }

  const urlsFromChoices =
    payload.output?.choices
      ?.flatMap((choice) => choice.message?.content ?? [])
      .flatMap((item) => (typeof item.image === 'string' ? [item.image] : []))
      ?? []

  if (urlsFromChoices.length > 0) {
    return urlsFromChoices
  }

  const failedResult = payload.output?.results?.find(
    (result) => result.code || result.message,
  )

  if (failedResult) {
    throw new Error(
      `DashScope image task failed: ${failedResult.message || failedResult.code}`,
    )
  }

  throw new Error('DashScope image generation did not return any image URLs')
}

async function waitForTask(taskId: string) {
  const deadline = Date.now() + TASK_TIMEOUT_MS

  while (Date.now() <= deadline) {
    const response = await fetchWithTimeout(`${qwenApiBaseURL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getQwenApiKey()}`,
      },
    })
    const payload = await readJsonResponse(response, 'task polling')
    const status = payload.output?.task_status

    if (status === 'SUCCEEDED') {
      return payload
    }

    if (
      status === 'FAILED' ||
      status === 'CANCELED' ||
      status === 'UNKNOWN'
    ) {
      throw new Error(
        `DashScope image task failed: ${payload.message || status.toLowerCase()}`,
      )
    }

    await new Promise((resolve) => setTimeout(resolve, TASK_POLL_INTERVAL_MS))
  }

  throw new Error('DashScope image task timed out')
}

async function downloadImage(url: string): Promise<GeneratedImage> {
  const response = await fetchWithTimeout(url, {})

  if (!response.ok) {
    throw new Error(
      `Failed to download generated image: ${response.status} ${response.statusText}`.trim(),
    )
  }

  const uint8Array = new Uint8Array(await response.arrayBuffer())
  const rawContentType = response.headers.get('content-type')?.split(';')[0]?.trim()
  const mediaType = VALID_IMAGE_MEDIA_TYPES.includes(
    rawContentType as (typeof VALID_IMAGE_MEDIA_TYPES)[number],
  )
    ? rawContentType!
    : 'image/png'

  return {
    base64: Buffer.from(uint8Array).toString('base64'),
    mediaType,
    uint8Array,
  }
}

async function generateWanImage(
  modelId: string,
  prompt: string,
  options: GenerateImageOptions,
) {
  const response = await fetchWithTimeout(
    `${qwenApiBaseURL}/services/aigc/image-generation/generation`,
    {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(buildRequestBody(modelId, prompt, options)),
    },
  )
  const payload = await readJsonResponse(response, 'image task creation')
  const taskId = payload.output?.task_id

  if (!taskId) {
    throw new Error('DashScope did not return an image task id')
  }

  return waitForTask(taskId)
}

async function generateQwenImage(
  modelId: string,
  prompt: string,
  options: GenerateImageOptions,
) {
  const response = await fetchWithTimeout(
    `${qwenApiBaseURL}/services/aigc/multimodal-generation/generation`,
    {
      method: 'POST',
      headers: buildHeaders(false),
      body: JSON.stringify(buildRequestBody(modelId, prompt, options)),
    },
  )

  return readJsonResponse(response, 'image generation')
}

export const imageModel = normalizeImageModel(process.env.QWEN_MODEL_IMAGE)

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {},
): Promise<GenerateImageResult> {
  assertQwenApiKey()

  const payload = isQwenImageModel(imageModel)
    ? await generateQwenImage(imageModel, prompt, options)
    : await generateWanImage(imageModel, prompt, options)
  const imageUrls = extractImageUrls(payload)
  const images = await Promise.all(imageUrls.map((url) => downloadImage(url)))

  return { images }
}
