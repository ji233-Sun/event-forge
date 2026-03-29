import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateInstrumentalMusic, mockR2Upload, mockGetSession } = vi.hoisted(() => ({
  mockGenerateInstrumentalMusic: vi.fn(),
  mockR2Upload: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generateInstrumentalMusic: mockGenerateInstrumentalMusic,
}))

vi.mock('@/lib/r2', () => ({
  r2Upload: mockR2Upload,
  r2KeyToMediaProxyUrl: (key: string) => `/api/media/${key}`,
  dataUrlToBuffer: (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    return { buffer: Buffer.from(match?.[2] ?? '', 'base64'), mediaType: match?.[1] ?? 'audio/mpeg' }
  },
}))

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))

import { POST } from './route'

describe('POST /api/question-runtime/music', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'calm piano' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when prompt is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('always uses fixed duration regardless of request body', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockGenerateInstrumentalMusic.mockResolvedValue({
      previewUrl: 'data:audio/mpeg;base64,xyz',
      mediaType: 'audio/mpeg',
      durationMs: 30000,
      sizeBytes: null,
      traceId: null,
    })
    mockR2Upload.mockResolvedValue(undefined)

    await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'calm piano', durationSeconds: 999 }),
    }))

    expect(mockGenerateInstrumentalMusic).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 30 }),
    )
  })

  it('uploads data URL audio to R2 and returns media proxy audioUrl', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockGenerateInstrumentalMusic.mockResolvedValue({
      previewUrl: 'data:audio/mpeg;base64,xyz',
      mediaType: 'audio/mpeg',
      durationMs: 30000,
      sizeBytes: null,
      traceId: null,
    })
    mockR2Upload.mockResolvedValue(undefined)

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'calm piano' }),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.audioUrl).toMatch(/^\/api\/media\/media\/user-1\/qr-.+\.mpeg$/)
    expect(mockR2Upload).toHaveBeenCalledOnce()
  })
})
