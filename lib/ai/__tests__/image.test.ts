import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockAssertQwenApiKey, mockGetQwenApiKey } = vi.hoisted(() => ({
  mockAssertQwenApiKey: vi.fn(),
  mockGetQwenApiKey: vi.fn(() => 'test-api-key'),
}))

vi.mock('../provider', () => ({
  assertQwenApiKey: mockAssertQwenApiKey,
  getQwenApiKey: mockGetQwenApiKey,
  qwenApiBaseURL: 'https://dashscope.aliyuncs.com/api/v1',
}))

const fetchMock = vi.fn<typeof fetch>()

async function loadImageModule() {
  vi.resetModules()
  return import('../image')
}

describe('lib/ai/image', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    delete process.env.QWEN_MODEL_IMAGE
  })

  describe('imageModel', () => {
    it('falls back to wan2.6-t2i by default', async () => {
      const { imageModel } = await loadImageModule()

      expect(imageModel).toBe('wan2.6-t2i')
    })

    it('normalizes the legacy wanx2.6-t2i-turbo alias', async () => {
      process.env.QWEN_MODEL_IMAGE = 'wanx2.6-t2i-turbo'

      const { imageModel } = await loadImageModule()

      expect(imageModel).toBe('wan2.6-t2i')
    })
  })

  describe('generateImage', () => {
    it('submits a DashScope image task, polls the result, and downloads the image bytes', async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              output: {
                task_id: 'task-123',
              },
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              output: {
                task_status: 'SUCCEEDED',
                results: [{ url: 'https://cdn.example.com/poster.png' }],
              },
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response(Uint8Array.from([137, 80, 78, 71]), {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
            },
          }),
        )

      const { generateImage } = await loadImageModule()

      const result = await generateImage('A cinematic rooftop concert poster', {
        n: 1,
        size: '1536x1024',
      })

      expect(mockAssertQwenApiKey).toHaveBeenCalledTimes(1)
      expect(mockGetQwenApiKey).toHaveBeenCalled()

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'X-DashScope-Async': 'enable',
          }),
        }),
      )

      const createTaskRequest = fetchMock.mock.calls[0]?.[1]
      expect(createTaskRequest).toBeDefined()
      expect(JSON.parse(String(createTaskRequest?.body))).toEqual({
        model: 'wan2.6-t2i',
        input: {
          messages: [
            {
              role: 'user',
              content: [{ text: 'A cinematic rooftop concert poster' }],
            },
          ],
        },
        parameters: {
          n: 1,
          prompt_extend: true,
          size: '1440*960',
          watermark: false,
        },
      })

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://dashscope.aliyuncs.com/api/v1/tasks/task-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        }),
      )
      expect(fetchMock.mock.calls[2]).toEqual([
        'https://cdn.example.com/poster.png',
      ])

      expect(result).toEqual({
        images: [
          {
            base64: 'iVBORw==',
            mediaType: 'image/png',
            uint8Array: Uint8Array.from([137, 80, 78, 71]),
          },
        ],
      })
    })
  })
})
