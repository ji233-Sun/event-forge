import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockStreamText, mockGetModel } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
  mockGetModel: vi.fn(),
}))

vi.mock('ai', () => ({
  streamText: mockStreamText,
}))

vi.mock('@/lib/ai', () => ({
  getModel: mockGetModel,
}))

import { POST } from './route'

describe('POST /api/question-runtime/chat', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when messages is missing', async () => {
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.any(String) })
  })

  it('returns 400 when messages is empty', async () => {
    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    }))
    expect(res.status).toBe(400)
  })

  it('calls streamText and returns a response on valid input', async () => {
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('hello'))
        controller.close()
      },
    })
    mockGetModel.mockReturnValue('mock-model')
    mockStreamText.mockReturnValue({ toUIMessageStreamResponse: () => new Response(readable) })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    }))
    expect(res.status).toBe(200)
    expect(mockStreamText).toHaveBeenCalledTimes(1)
    expect(mockStreamText).toHaveBeenCalledWith(expect.objectContaining({
      model: 'mock-model',
      system: 'You are a helpful survey assistant.',
    }))
  })
})
