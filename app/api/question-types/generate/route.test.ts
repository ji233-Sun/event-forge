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
  suggestedName: 'NPS Score',
  formCode: 'function Component({value, onChange}) { return <div /> }\nrender(<Component value={value} onChange={onChange} />)',
  displayCode: 'function Display({answer}) { return <div>{JSON.stringify(answer)}</div> }\nrender(<Display answer={answer} />)',
  answerSchema: { type: 'object', properties: { score: { type: 'number' } } },
}

describe('POST /api/question-types/generate', () => {
  afterEach(() => vi.clearAllMocks())

  beforeEach(() => {
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'NPS score' }),
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

  it('returns generated type on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(validResult) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'NPS score with comment' }),
    }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ suggestedName: 'NPS Score', formCode: expect.any(String) })
  })
})
