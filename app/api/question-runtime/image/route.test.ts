import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateImage } = vi.hoisted(() => ({
  mockGenerateImage: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generateImage: mockGenerateImage,
}))

import { POST } from './route'

describe('POST /api/question-runtime/image', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when prompt is missing', async () => {
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when prompt is too long', async () => {
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'x'.repeat(1001) }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns imageUrl on success', async () => {
    mockGenerateImage.mockResolvedValue({
      images: [{ base64: 'abc123', mediaType: 'image/png' }],
    })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a sunset' }),
    }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      imageUrl: 'data:image/png;base64,abc123',
    })
  })
})
