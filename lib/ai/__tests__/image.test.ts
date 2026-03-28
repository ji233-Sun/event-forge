import { describe, it, expect, vi, afterEach } from 'vitest'

// Hoisted mocks — executed before any import
vi.mock('server-only', () => ({}))

const { mockQwenProviderImage, mockSdkGenerateImage } = vi.hoisted(() => ({
  mockQwenProviderImage: vi.fn().mockReturnValue({ modelId: 'mock-image-model' }),
  mockSdkGenerateImage: vi.fn(),
}))

vi.mock('../provider', () => ({
  qwenProvider: {
    image: mockQwenProviderImage,
  },
}))

vi.mock('ai', () => ({
  generateImage: mockSdkGenerateImage,
}))

import { generateImage, imageModel } from '../image'

describe('lib/ai/image', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('imageModel', () => {
    it('is initialised with the default model id', () => {
      // QWEN_MODEL_IMAGE not set in test env → falls back to wanx2.6-t2i-turbo
      expect(mockQwenProviderImage).toHaveBeenCalledWith('wanx2.6-t2i-turbo')
    })
  })

  describe('generateImage', () => {
    it('calls sdkGenerateImage with imageModel and prompt', async () => {
      mockSdkGenerateImage.mockResolvedValue({ images: [] })

      await generateImage('a sunset over mountains')

      expect(mockSdkGenerateImage).toHaveBeenCalledWith({
        model: imageModel,
        prompt: 'a sunset over mountains',
      })
    })

    it('passes through options (size, n)', async () => {
      mockSdkGenerateImage.mockResolvedValue({ images: [] })

      await generateImage('a cat', { size: '1024x1024', n: 2 })

      expect(mockSdkGenerateImage).toHaveBeenCalledWith({
        model: imageModel,
        prompt: 'a cat',
        size: '1024x1024',
        n: 2,
      })
    })

    it('returns the raw SDK response', async () => {
      const fakeImages = [{ base64: 'abc123', mimeType: 'image/png', uint8Array: new Uint8Array() }]
      mockSdkGenerateImage.mockResolvedValue({ images: fakeImages })

      const result = await generateImage('test prompt')

      expect(result).toEqual({ images: fakeImages })
    })
  })
})
