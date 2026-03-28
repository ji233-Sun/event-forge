import { afterEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetSession,
  mockGeneratePosterAsset,
  mockDbInsert,
  mockDbInsertValues,
  mockDbSelect,
  mockDbSelectFrom,
  mockDbSelectWhere,
  mockDbSelectLimit,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGeneratePosterAsset: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbInsertValues: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbSelectFrom: vi.fn(),
  mockDbSelectWhere: vi.fn(),
  mockDbSelectLimit: vi.fn(),
}))

mockDbSelect.mockImplementation(() => ({
  from: mockDbSelectFrom,
}))
mockDbSelectFrom.mockImplementation(() => ({
  where: mockDbSelectWhere,
}))
mockDbSelectWhere.mockImplementation(() => ({
  limit: mockDbSelectLimit,
}))
mockDbInsert.mockImplementation(() => ({
  values: mockDbInsertValues,
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}))

vi.mock('@/lib/multimedia/generator', () => ({
  generatePosterAsset: mockGeneratePosterAsset,
  resolvePosterAspectRatio: (value: string | undefined) => value ?? '16:9',
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: mockDbSelect,
    insert: mockDbInsert,
  },
}))

import { POST } from './route'

describe('POST /api/multimedia/poster', () => {
  afterEach(() => {
    vi.clearAllMocks()
    mockDbSelectLimit.mockResolvedValue([])
    mockDbInsertValues.mockResolvedValue(undefined)
  })

  it('returns 401 for unauthenticated requests', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/multimedia/poster', {
        method: 'POST',
        body: JSON.stringify({
          brief: 'Poster brief',
          conceptTitle: 'Title',
          visualDirection: 'Direction',
          prompt: 'Prompt',
          aspectRatio: '16:9',
        }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Authentication required.',
    })
  })

  it('returns 400 when required fields are missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

    const response = await POST(
      new Request('http://localhost/api/multimedia/poster', {
        method: 'POST',
        body: JSON.stringify({
          conceptTitle: 'Title only',
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error:
        'Invalid poster regenerate payload. brief, conceptTitle, visualDirection, and prompt are required.',
    })
  })

  it('returns a non-persisted poster variant without parentId', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockGeneratePosterAsset.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,poster-variant',
      prompt: 'Poster prompt variant',
      aspectRatio: '4:5',
    })

    const response = await POST(
      new Request('http://localhost/api/multimedia/poster', {
        method: 'POST',
        body: JSON.stringify({
          brief: 'Build a launch poster for social feeds.',
          conceptTitle: 'Launch Pulse',
          visualDirection: 'High contrast typography with clear title hierarchy',
          prompt: 'Poster prompt variant',
          aspectRatio: '4:5',
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      persisted: false,
      variant: {
        parentId: null,
        imageDataUrl: 'data:image/png;base64,poster-variant',
        prompt: 'Poster prompt variant',
        aspectRatio: '4:5',
      },
    })
    expect(mockGeneratePosterAsset).toHaveBeenCalledWith('Poster prompt variant', '4:5')
  })

  it('persists a poster variant when parentId is provided', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockDbSelectLimit.mockResolvedValue([
      {
        id: 'parent-1',
        userId: 'user-1',
        result: {
          brief: 'Original launch brief',
          concept: {
            title: 'Launch Pulse',
            visualDirection: 'High contrast typography with clear title hierarchy',
          },
          poster: {
            alt: 'Launch poster',
            imageDataUrl: 'data:image/png;base64,parent-poster',
            prompt: 'Original poster prompt',
            aspectRatio: '9:16',
          },
          socialCopy: {
            caption: 'Caption',
            cta: 'CTA',
            hashtags: ['#EventForge'],
            shareText: 'Caption',
          },
        },
      },
    ])
    mockGeneratePosterAsset.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,poster-variant-persisted',
      prompt: 'Original poster prompt',
      aspectRatio: '9:16',
    })

    const response = await POST(
      new Request('http://localhost/api/multimedia/poster', {
        method: 'POST',
        body: JSON.stringify({
          parentId: 'parent-1',
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      persisted: true,
      variant: {
        parentId: 'parent-1',
        imageDataUrl: 'data:image/png;base64,poster-variant-persisted',
        prompt: 'Original poster prompt',
        aspectRatio: '9:16',
      },
    })
    expect(mockGeneratePosterAsset).toHaveBeenCalledWith('Original poster prompt', '9:16')
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: 'parent-1',
        userId: 'user-1',
        posterPrompt: 'Original poster prompt',
        aspectRatio: '9:16',
        imageDataUrl: 'data:image/png;base64,poster-variant-persisted',
      }),
    )
  })
})
