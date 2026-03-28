import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateInstrumentalMusic } = vi.hoisted(() => ({
  mockGenerateInstrumentalMusic: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generateInstrumentalMusic: mockGenerateInstrumentalMusic,
}))

import { POST } from './route'

describe('POST /api/question-runtime/music', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when prompt is missing', async () => {
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('returns audioUrl on success', async () => {
    mockGenerateInstrumentalMusic.mockResolvedValue({
      previewUrl: 'data:audio/mpeg;base64,xyz',
      mediaType: 'audio/mpeg',
      durationMs: 30000,
      sizeBytes: null,
      traceId: null,
    })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'calm piano', durationSeconds: 30 }),
    }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      audioUrl: 'data:audio/mpeg;base64,xyz',
    })
  })
})
