import 'server-only'

import { Buffer } from 'node:buffer'
import {
  assertMinimaxApiKey,
  getMinimaxApiKey,
  getMinimaxMusicModel,
  minimaxApiBaseURL,
} from './provider'

const MINIMAX_TIMEOUT_MS = 600_000
const DEFAULT_AUDIO_FORMAT = 'mp3'
const DEFAULT_SAMPLE_RATE = 44_100
const DEFAULT_BITRATE = 256_000

// Sample size for encoding detection — large audio strings crash RegExp.test() via stack overflow
const FORMAT_SAMPLE_SIZE = 1024
const HEX_PATTERN = /^[0-9a-fA-F]+$/
const BASE64_SAMPLE_PATTERN = /^[A-Za-z0-9+/]+=*$/

type MinimaxBaseResp = {
  status_code?: number
  status_msg?: string
}

type MinimaxMusicData = {
  audio?: string
  audio_url?: string
  status?: number
}

type MinimaxExtraInfo = {
  music_duration?: number
  music_size?: number
  music_sample_rate?: number
  bitrate?: number
}

type MinimaxMusicResponse = {
  data?: MinimaxMusicData
  extra_info?: MinimaxExtraInfo
  trace_id?: string
  base_resp?: MinimaxBaseResp
}

type MinimaxLyricsData = {
  song_title?: string
  style_tags?: string
  lyrics?: string
}

type MinimaxLyricsResponse = {
  data?: MinimaxLyricsData
  base_resp?: MinimaxBaseResp
}

export type GenerateMusicInput = {
  prompt: string
  withLyrics: boolean
}

export type GeneratedMusic = {
  previewUrl: string
  mediaType: string
  durationMs: number | null
  sizeBytes: number | null
  traceId: string | null
  lyrics?: string
}

export type GenerateInstrumentalMusicInput = {
  prompt: string
  durationSeconds: number
  mood: string
  tempo: string
  instrumentation: string
}

export type GeneratedInstrumentalMusic = {
  previewUrl: string
  mediaType: string
  durationMs: number | null
  sizeBytes: number | null
  traceId: string | null
}

const INSTRUMENTAL_DURATION_MIN = 30
const INSTRUMENTAL_DURATION_MAX = 45

function clampDuration(seconds: number): number {
  return Math.min(INSTRUMENTAL_DURATION_MAX, Math.max(INSTRUMENTAL_DURATION_MIN, seconds))
}

function buildInstrumentalPrompt(input: GenerateInstrumentalMusicInput) {
  const lines = [
    'Create a pure instrumental soundtrack.',
    `Mood: ${input.mood}.`,
    `Tempo: ${input.tempo}.`,
    `Instrumentation focus: ${input.instrumentation}.`,
    `Target duration: around ${clampDuration(input.durationSeconds)} seconds.`,
    `Creative direction: ${input.prompt}.`,
    'No vocals. No spoken words. No lyrics.',
  ]

  return lines.join(' ')
}

function toAudioMediaType(format: string) {
  const normalized = format.trim().toLowerCase()
  if (normalized === 'wav') {
    return 'audio/wav'
  }
  return 'audio/mpeg'
}

function isHex(value: string) {
  if (value.length === 0 || value.length % 2 !== 0) return false
  return HEX_PATTERN.test(value.slice(0, FORMAT_SAMPLE_SIZE))
}

function isLikelyBase64(value: string) {
  if (value.length === 0 || value.length % 4 !== 0) return false
  return BASE64_SAMPLE_PATTERN.test(value.slice(0, FORMAT_SAMPLE_SIZE))
}

function toDataUrl(rawAudio: string, mediaType: string) {
  const compact = rawAudio.trim().replace(/\s+/g, '')

  if (compact.startsWith('data:audio/')) {
    return compact
  }

  if (isHex(compact)) {
    const base64 = Buffer.from(compact, 'hex').toString('base64')
    return `data:${mediaType};base64,${base64}`
  }

  if (isLikelyBase64(compact)) {
    return `data:${mediaType};base64,${compact}`
  }

  throw new Error('MiniMax returned an unsupported audio encoding format')
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = MINIMAX_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`MiniMax request timed out after ${timeoutMs / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function readMinimaxResponse(response: Response): Promise<MinimaxMusicResponse> {
  const text = await response.text()
  const payload = text ? (JSON.parse(text) as MinimaxMusicResponse) : {}
  const baseRespCode = payload.base_resp?.status_code

  if (!response.ok || (typeof baseRespCode === 'number' && baseRespCode !== 0)) {
    const message =
      payload.base_resp?.status_msg ||
      `${response.status} ${response.statusText}`.trim() ||
      'Unknown MiniMax music error'

    throw new Error(`MiniMax music generation failed: ${message}`)
  }

  return payload
}

function normalizePreviewUrl(payload: MinimaxMusicResponse, mediaType: string) {
  const data = payload.data

  if (!data) {
    throw new Error('MiniMax music generation returned an empty payload')
  }

  if (typeof data.audio_url === 'string' && data.audio_url.trim().length > 0) {
    return data.audio_url.trim()
  }

  if (typeof data.audio === 'string' && data.audio.trim().length > 0) {
    return toDataUrl(data.audio, mediaType)
  }

  throw new Error('MiniMax music generation did not return playable audio')
}

async function generateLyrics(prompt: string): Promise<string> {
  const response = await fetchWithTimeout(`${minimaxApiBaseURL}/v1/lyrics_generation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getMinimaxApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getMinimaxMusicModel(),
      mode: 'write_full_song',
      prompt,
    }),
  })

  const text = await response.text()
  const payload = text ? (JSON.parse(text) as MinimaxLyricsResponse) : {}
  const baseRespCode = payload.base_resp?.status_code

  if (!response.ok || (typeof baseRespCode === 'number' && baseRespCode !== 0)) {
    const message =
      payload.base_resp?.status_msg ||
      `${response.status} ${response.statusText}`.trim() ||
      'Unknown MiniMax lyrics error'
    throw new Error(`MiniMax lyrics generation failed: ${message}`)
  }

  const lyrics = payload.data?.lyrics
  if (!lyrics || lyrics.trim().length === 0) {
    throw new Error('MiniMax lyrics generation returned empty lyrics')
  }

  return lyrics.trim()
}

export async function generateMusic(input: GenerateMusicInput): Promise<GeneratedMusic> {
  assertMinimaxApiKey()

  const format = DEFAULT_AUDIO_FORMAT
  const mediaType = toAudioMediaType(format)

  let lyrics: string | undefined

  if (input.withLyrics) {
    lyrics = await generateLyrics(input.prompt)
  }

  const musicBody = lyrics
    ? {
        model: getMinimaxMusicModel(),
        prompt: input.prompt,
        lyrics,
        output_format: 'url',
        audio_setting: {
          sample_rate: DEFAULT_SAMPLE_RATE,
          bitrate: DEFAULT_BITRATE,
          format,
        },
      }
    : {
        model: getMinimaxMusicModel(),
        prompt: input.prompt,
        is_instrumental: true,
        output_format: 'url',
        audio_setting: {
          sample_rate: DEFAULT_SAMPLE_RATE,
          bitrate: DEFAULT_BITRATE,
          format,
        },
      }

  const response = await fetchWithTimeout(`${minimaxApiBaseURL}/v1/music_generation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getMinimaxApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(musicBody),
  })

  const payload = await readMinimaxResponse(response)
  const previewUrl = normalizePreviewUrl(payload, mediaType)

  return {
    previewUrl,
    mediaType,
    durationMs: payload.extra_info?.music_duration ?? null,
    sizeBytes: payload.extra_info?.music_size ?? null,
    traceId: payload.trace_id ?? null,
    lyrics,
  }
}

export async function generateInstrumentalMusic(
  input: GenerateInstrumentalMusicInput,
): Promise<GeneratedInstrumentalMusic> {
  assertMinimaxApiKey()

  const prompt = buildInstrumentalPrompt(input)
  const format = DEFAULT_AUDIO_FORMAT
  const mediaType = toAudioMediaType(format)

  const response = await fetchWithTimeout(`${minimaxApiBaseURL}/v1/music_generation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getMinimaxApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getMinimaxMusicModel(),
      prompt,
      is_instrumental: true,
      output_format: 'url',
      audio_setting: {
        sample_rate: DEFAULT_SAMPLE_RATE,
        bitrate: DEFAULT_BITRATE,
        format,
      },
    }),
  })

  const payload = await readMinimaxResponse(response)
  const previewUrl = normalizePreviewUrl(payload, mediaType)

  return {
    previewUrl,
    mediaType,
    durationMs: payload.extra_info?.music_duration ?? null,
    sizeBytes: payload.extra_info?.music_size ?? null,
    traceId: payload.trace_id ?? null,
  }
}
