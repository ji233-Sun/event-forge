import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession, mockGenerateMusic, mockR2Upload } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGenerateMusic: vi.fn(),
  mockR2Upload: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}))

vi.mock('@/lib/ai', () => ({
  generateMusic: mockGenerateMusic,
}))

vi.mock('@/lib/r2', () => ({
  r2Upload: mockR2Upload,
  r2KeyToMediaProxyUrl: (key: string) => `/api/media/${key}`,
  dataUrlToBuffer: (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    return { buffer: Buffer.from(match?.[2] ?? '', 'base64'), mediaType: match?.[1] ?? 'audio/mpeg' }
  },
}))

vi.mock('@/lib/db', () => ({
  db: {
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  },
}))

import { POST } from './route'

describe('POST /api/multimedia/music', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'A relaxing ambient track', withLyrics: false }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required.' })
  })

  it('returns 400 when prompt is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({ withLyrics: false }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Please provide a music prompt.' })
    expect(mockGenerateMusic).not.toHaveBeenCalled()
  })

  it('returns a playable instrumental soundtrack on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockR2Upload.mockResolvedValue(undefined)
    mockGenerateMusic.mockResolvedValue({
      previewUrl: 'data:audio/mpeg;base64,abc123',
      mediaType: 'audio/mpeg',
      durationMs: 30000,
      sizeBytes: 123456,
      traceId: 'trace-1',
      lyrics: undefined,
    })

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'A relaxing ambient track', withLyrics: false }),
      }),
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.soundtrack).toMatchObject({
      title: 'Generated Instrumental',
      durationLabel: '30s',
    })
    expect(body.soundtrack.previewUrl).toMatch(/^\/api\/media\//)
    expect(mockGenerateMusic).toHaveBeenCalledWith({ prompt: 'A relaxing ambient track', withLyrics: false })
  })

  it('includes lyrics in the response when withLyrics is true', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockR2Upload.mockResolvedValue(undefined)
    mockGenerateMusic.mockResolvedValue({
      previewUrl: 'data:audio/mpeg;base64,abc123',
      mediaType: 'audio/mpeg',
      durationMs: 45000,
      sizeBytes: 200000,
      traceId: 'trace-2',
      lyrics: 'Verse 1\nHello world\nChorus\nLa la la',
    })

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'An upbeat pop song', withLyrics: true }),
      }),
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.soundtrack.title).toBe('Generated Song')
    expect(body.soundtrack.lyrics).toBe('Verse 1\nHello world\nChorus\nLa la la')
    expect(mockGenerateMusic).toHaveBeenCalledWith({ prompt: 'An upbeat pop song', withLyrics: true })
  })
})
