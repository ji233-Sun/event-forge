import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockCreateOpenAI } = vi.hoisted(() => ({
  mockCreateOpenAI: vi.fn().mockReturnValue({
    image: vi.fn(),
  }),
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}))

describe('lib/ai/provider', () => {
  afterEach(() => {
    vi.clearAllMocks()
    delete process.env.QWEN_API_KEY
  })

  it('can be imported without QWEN_API_KEY so Next build does not fail at module load time', async () => {
    await expect(import('../provider')).resolves.toMatchObject({
      qwenProvider: expect.any(Object),
    })

    expect(mockCreateOpenAI).toHaveBeenCalledWith({
      apiKey: 'missing-qwen-api-key',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  })

  it('throws a clear runtime error when AI is used without QWEN_API_KEY', async () => {
    const { assertQwenApiKey } = await import('../provider')

    expect(() => assertQwenApiKey()).toThrow('[lib/ai] QWEN_API_KEY is not set')
  })
})
