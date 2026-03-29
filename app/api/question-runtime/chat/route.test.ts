import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateText, mockGetModel } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
  mockGetModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: mockGenerateText,
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

  it('calls generateText and returns { text } on valid input', async () => {
    mockGetModel.mockReturnValue('mock-model')
    mockGenerateText.mockResolvedValue({ text: 'hello' })

    const res = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ text: 'hello' })
    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    expect(mockGenerateText).toHaveBeenCalledWith(expect.objectContaining({
      model: 'mock-model',
      system: 'You are a helpful survey assistant.',
    }))
  })
})
