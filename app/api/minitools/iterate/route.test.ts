import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession, mockGenerateText, mockHeaders } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGenerateText: vi.fn(),
  mockHeaders: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mockGetSession } } }))
vi.mock('ai', () => ({ generateText: mockGenerateText }))
vi.mock('@/lib/ai', () => ({ getModel: vi.fn(() => 'mock-model') }))
vi.mock('@/lib/ai/provider', () => ({ assertMinimaxApiKey: vi.fn() }))
vi.mock('next/headers', () => ({ headers: mockHeaders }))

import { POST } from './route'

const currentResult = {
  suggestedName: 'Live Poll',
  componentCode: 'function Component({visitorId}) { return <div /> }\nrender(<Component visitorId={visitorId} />)',
  hostCode: 'function HostView({participantCount}) { return <div>{participantCount}</div> }\nrender(<HostView participantCount={participantCount} />)',
}

describe('POST /api/minitools/iterate', () => {
  beforeEach(() => {
    mockHeaders.mockResolvedValue(new Headers())
  })

  afterEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'Live audience poll with emoji voting',
        feedback: 'Fix the host view so it groups duplicate votes.',
        currentResult,
      }),
    }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when current result is incomplete', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'Live audience poll with emoji voting',
        feedback: 'Fix the host view so it groups duplicate votes.',
        currentResult: { componentCode: currentResult.componentCode },
      }),
    }))

    expect(res.status).toBe(400)
  })

  it('returns an iterated minitool on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(currentResult) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'Live audience poll with emoji voting',
        feedback: 'Add an empty state to the host dashboard and make the submit button more obvious.',
        currentResult,
      }),
    }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      suggestedName: 'Live Poll',
      componentCode: expect.any(String),
      hostCode: expect.any(String),
    })
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Add an empty state to the host dashboard'),
    }))
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Live audience poll with emoji voting'),
    }))
  })

  it('returns 500 when AI output is missing required fields', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify({ suggestedName: 'Incomplete' }) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'Live audience poll with emoji voting',
        feedback: 'Add a leaderboard.',
        currentResult,
      }),
    }))

    expect(res.status).toBe(500)
  })
})
