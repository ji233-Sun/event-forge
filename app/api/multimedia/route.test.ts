import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_POSTER_ASPECT_RATIO } from '@/lib/multimedia/types'

const { mockGenerateMultimediaExperience, mockGetSession } = vi.hoisted(() => ({
  mockGenerateMultimediaExperience: vi.fn(),
  mockGetSession: vi.fn(),
}))

vi.mock('@/lib/multimedia/generator', () => ({
  generateMultimediaExperience: mockGenerateMultimediaExperience,
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}))

import { POST } from './route'

describe('POST /api/multimedia', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated requests', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/multimedia', {
        method: 'POST',
        body: JSON.stringify({ brief: 'A rooftop concert.' }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Authentication required.',
    })
    expect(mockGenerateMultimediaExperience).not.toHaveBeenCalled()
  })

  it('rejects an empty brief', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

    const response = await POST(
      new Request('http://localhost/api/multimedia', {
        method: 'POST',
        body: JSON.stringify({ brief: '   ' }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Please provide an event brief before generating media.',
    })
    expect(mockGenerateMultimediaExperience).not.toHaveBeenCalled()
  })

  it('returns the generated multimedia payload for a valid brief', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockGenerateMultimediaExperience.mockResolvedValue({
      brief: 'Launch a rooftop DJ night.',
      concept: {
        title: 'Rooftop Frequency',
        visualDirection: 'Mirrored lights over a skyline terrace',
      },
      poster: {
        alt: 'Rooftop Frequency poster',
        imageDataUrl: 'data:image/png;base64,abc',
        prompt: 'Poster prompt',
      },
      socialCopy: {
        caption: '⚡ Skyline beats all night.',
        cta: 'Join the drop',
        hashtags: ['#EventForge'],
        shareText: '⚡ Skyline beats all night.\n\nJoin the drop\n#EventForge',
      },
    })

    const response = await POST(
      new Request('http://localhost/api/multimedia', {
        method: 'POST',
        body: JSON.stringify({ brief: 'Launch a rooftop DJ night.' }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      data: {
        concept: {
          title: 'Rooftop Frequency',
        },
      },
    })
    expect(mockGenerateMultimediaExperience).toHaveBeenCalledWith('Launch a rooftop DJ night.', {
      aspectRatio: DEFAULT_POSTER_ASPECT_RATIO,
    })
  })
})
