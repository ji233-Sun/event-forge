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

const currentResult = {
  suggestedName: 'NPS Score',
  formCode: 'function Component({value, onChange}) { return <div /> }\nrender(<Component value={value} onChange={onChange} />)',
  displayCode: 'function Display({answer}) { return <div>{JSON.stringify(answer)}</div> }\nrender(<Display answer={answer} />)',
  answerSchema: { type: 'object', properties: { score: { type: 'number' } } },
}

describe('POST /api/question-types/iterate', () => {
  beforeEach(() => {
    mockHeaders.mockResolvedValue(new Headers())
  })

  afterEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'NPS score with comment',
        feedback: 'Make the slider easier to use on mobile.',
        currentResult,
      }),
    }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when feedback is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'NPS score with comment',
        currentResult,
      }),
    }))

    expect(res.status).toBe(400)
  })

  it('returns an iterated question type on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(currentResult) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'NPS score with comment',
        feedback: 'Fix the spacing bug and add clearer success feedback.',
        currentResult,
      }),
    }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      suggestedName: 'NPS Score',
      formCode: expect.any(String),
      displayCode: expect.any(String),
    })
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Fix the spacing bug and add clearer success feedback.'),
    }))
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('NPS score with comment'),
    }))
  })

  it('returns 500 when AI output is missing required fields', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify({ suggestedName: 'Incomplete' }) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        originalPrompt: 'NPS score with comment',
        feedback: 'Tighten the layout.',
        currentResult,
      }),
    }))

    expect(res.status).toBe(500)
  })
})
