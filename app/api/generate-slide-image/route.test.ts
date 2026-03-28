import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateImage, mockGetSession, mockHeaders, mockR2Upload } = vi.hoisted(() => ({
  mockGenerateImage: vi.fn(),
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
  mockR2Upload: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({ generateImage: mockGenerateImage }))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))

vi.mock('next/headers', () => ({ headers: mockHeaders }))

vi.mock('@/lib/r2', () => ({
  r2Upload: mockR2Upload,
  r2KeyToProxyUrl: (key: string) => `/api/slides/image/${key}`,
}))

import { POST } from './route'

beforeEach(() => {
  mockGetSession.mockResolvedValue(authedSession)
  mockHeaders.mockResolvedValue(new Headers())
  mockR2Upload.mockResolvedValue(undefined)
})

const authedSession = { user: { id: 'user-1' } }
const fakeImage = { base64: 'abc123', mediaType: 'image/png', uint8Array: new Uint8Array() }

afterEach(() => {
  mockGenerateImage.mockReset()
  mockGetSession.mockReset()
  mockHeaders.mockReset()
  mockR2Upload.mockReset()
  mockGetSession.mockResolvedValue(authedSession)
  mockHeaders.mockResolvedValue(new Headers())
  mockR2Upload.mockResolvedValue(undefined)
})

describe('POST /api/generate-slide-image', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/generate-slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt: 'A blue slide', slideIndex: 0 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing imagePrompt', async () => {
    const req = new Request('http://localhost/api/generate-slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideIndex: 0 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'imagePrompt is required' })
  })

  it('returns 400 for missing slideIndex', async () => {
    const req = new Request('http://localhost/api/generate-slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt: 'A blue slide' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'slideIndex is required' })
  })

  it('uploads to R2 and returns proxy URL on success', async () => {
    mockGenerateImage.mockResolvedValueOnce({ images: [fakeImage] })
    const req = new Request('http://localhost/api/generate-slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt: 'A blue slide', slideIndex: 2 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { index: number; url: string }
    expect(body.index).toBe(2)
    expect(body.url).toMatch(/^\/api\/slides\/image\/slides\/user-1\/.+\.png$/)
    expect(mockR2Upload).toHaveBeenCalledOnce()
    expect(mockGenerateImage).toHaveBeenCalledWith('A blue slide', { size: '1920*1080' })
  })

  it('returns 502 when image generation throws', async () => {
    mockGenerateImage.mockRejectedValueOnce(new Error('model error'))
    const req = new Request('http://localhost/api/generate-slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt: 'A slide', slideIndex: 0 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when generateImage returns an empty images array', async () => {
    mockGenerateImage.mockResolvedValueOnce({ images: [] })
    const req = new Request('http://localhost/api/generate-slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePrompt: 'A slide', slideIndex: 1 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })
})
