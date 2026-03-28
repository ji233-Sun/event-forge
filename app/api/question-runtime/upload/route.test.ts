import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockR2Upload } = vi.hoisted(() => ({
  mockR2Upload: vi.fn(),
}))

vi.mock('@/lib/r2', () => ({
  r2Upload: mockR2Upload,
  r2KeyToProxyUrl: (key: string) => `/api/slides/image/${key}`,
}))

import { POST } from './route'

describe('POST /api/question-runtime/upload', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when no file in FormData', async () => {
    const formData = new FormData()
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when file exceeds 10MB', async () => {
    const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', bigBlob, 'big.png')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining('10MB') })
  })

  it('returns fileUrl as proxy path on success', async () => {
    mockR2Upload.mockResolvedValue(undefined)
    const blob = new Blob(['hello'], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', blob, 'test.png')
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.fileUrl).toMatch(/^\/api\/slides\/image\/question-uploads\//)
  })
})
