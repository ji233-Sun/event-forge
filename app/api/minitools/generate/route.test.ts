import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession, mockGenerateText, mockHeaders } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGenerateText: vi.fn(),
  mockHeaders: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mockGetSession } } }))
vi.mock('ai', () => ({ generateText: mockGenerateText }))
vi.mock('@/lib/ai', () => ({ getModel: vi.fn(() => 'mock-model') }))
vi.mock('next/headers', () => ({ headers: mockHeaders }))

import { POST } from './route'

const validResult = {
  suggestedName: 'Live Poll',
  componentCode: 'function Component({visitorId}) { return <div /> }\nrender(<Component visitorId={visitorId} />)',
  hostCode: 'function HostView({participantCount}) { return <div>{participantCount}</div> }\nrender(<HostView participantCount={participantCount} />)',
}

describe('POST /api/minitools/generate', () => {
  beforeEach(() => mockHeaders.mockResolvedValue(new Headers()))
  afterEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'live poll' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when prompt is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when prompt exceeds 500 chars', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'x'.repeat(501) }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns generated minitool on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(validResult) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'live poll with emojis' }),
    }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      suggestedName: 'Live Poll',
      componentCode: expect.any(String),
      hostCode: expect.any(String),
    })
  })

  it('returns 500 when AI output is missing required fields', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify({ suggestedName: 'Incomplete' }) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'live poll' }),
    }))
    expect(res.status).toBe(500)
  })
})
