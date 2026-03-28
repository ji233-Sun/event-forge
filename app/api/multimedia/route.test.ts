import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateMultimediaExperience } = vi.hoisted(() => ({
  mockGenerateMultimediaExperience: vi.fn(),
}))

vi.mock('@/lib/multimedia/generator', () => ({
  generateMultimediaExperience: mockGenerateMultimediaExperience,
}))

import { POST } from './route'

describe('POST /api/multimedia', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('rejects an empty brief', async () => {
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
      soundtrack: {
        id: 'neon-pulse',
        title: 'Neon Pulse',
        description: 'Synthetic energy',
        previewUrl: 'https://example.com/audio.mp3',
        durationLabel: 'Demo loop',
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
        soundtrack: {
          id: 'neon-pulse',
        },
      },
    })
    expect(mockGenerateMultimediaExperience).toHaveBeenCalledWith('Launch a rooftop DJ night.')
  })
})
