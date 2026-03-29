import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateImage, mockR2Upload, mockGetSession } = vi.hoisted(() => ({
  mockGenerateImage: vi.fn(),
  mockR2Upload: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generateImage: mockGenerateImage,
}))

vi.mock('@/lib/r2', () => ({
  r2Upload: mockR2Upload,
  r2KeyToMediaProxyUrl: (key: string) => `/api/media/${key}`,
  dataUrlToBuffer: (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    return { buffer: Buffer.from(match?.[2] ?? '', 'base64'), mediaType: match?.[1] ?? 'image/png' }
  },
}))

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
}))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))

import { POST } from './route'

describe('POST /api/question-runtime/image', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a sunset' }),
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

  it('returns 400 when prompt is too long', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'x'.repeat(1001) }),
    }))
    expect(res.status).toBe(400)
  })

  it('uploads to R2 and returns media proxy imageUrl on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockGenerateImage.mockResolvedValue({
      images: [{ base64: 'abc123', mediaType: 'image/png' }],
    })
    mockR2Upload.mockResolvedValue(undefined)

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a sunset' }),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.imageUrl).toMatch(/^\/api\/media\/media\/user-1\/qr-.+\.png$/)
    expect(mockR2Upload).toHaveBeenCalledOnce()
  })
})
