import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerate, mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({ generate: mockGenerate }))

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: mockGetSession } },
}))

vi.mock('next/headers', () => ({ headers: mockHeaders }))

import { POST } from './route'

const authedSession = { user: { id: 'user-1' } }

afterEach(() => {
  mockGenerate.mockReset()
  mockGetSession.mockReset()
  mockHeaders.mockReset()
  mockGetSession.mockResolvedValue(authedSession)
  mockHeaders.mockResolvedValue(new Headers())
})

describe('POST /api/generate-slide-plan', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A festival' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing prompt', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'prompt is required' })
  })

  it('returns 400 for whitespace-only prompt', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '   ' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns slides array on success', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    mockGenerate.mockResolvedValueOnce({
      text: JSON.stringify({
        slides: [
          { index: 0, title: 'Cover', imagePrompt: 'A blue slide with title text' },
          { index: 1, title: 'Overview', imagePrompt: 'A dark slide with bullet points' },
          { index: 2, title: 'Stats', imagePrompt: 'A slide with a bar chart' },
          { index: 3, title: 'Budget', imagePrompt: 'A slide showing budget breakdown' },
          { index: 4, title: 'Timeline', imagePrompt: 'A slide with a timeline' },
          { index: 5, title: 'Close', imagePrompt: 'A closing slide with CTA' },
        ],
      }),
      finishReason: 'stop',
    })
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A campus music festival' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.slides).toHaveLength(6)
    expect(body.slides[0]).toMatchObject({ index: 0, title: 'Cover' })
    expect(typeof body.slides[0].imagePrompt).toBe('string')
  })

  it('returns 502 when AI generation throws', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    mockGenerate.mockRejectedValueOnce(new Error('provider down'))
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A festival' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when model returns fewer than 6 slides', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    mockGenerate.mockResolvedValueOnce({
      text: JSON.stringify({ slides: [{ index: 0, title: 'Only', imagePrompt: 'One slide' }] }),
      finishReason: 'stop',
    })
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A festival' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when model output is truncated', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    mockGenerate.mockResolvedValueOnce({
      text: '{"slides": []}',
      finishReason: 'length',
    })
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A festival' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when model returns malformed JSON', async () => {
    mockGetSession.mockResolvedValue(authedSession)
    mockGenerate.mockResolvedValueOnce({
      text: 'not valid json at all',
      finishReason: 'stop',
    })
    const req = new Request('http://localhost/api/generate-slide-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A festival' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })
})
