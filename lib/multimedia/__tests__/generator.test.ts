import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_POSTER_ASPECT_RATIO } from '../types'

vi.mock('server-only', () => ({}))

const { mockGenerate, mockGenerateImage } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockGenerateImage: vi.fn(),
}))

vi.mock('@/lib/ai', () => ({
  generate: mockGenerate,
  generateImage: mockGenerateImage,
}))

import { generateMultimediaExperience } from '../generator'

describe('generateMultimediaExperience', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('maps model JSON and image output into the studio payload', async () => {
    mockGenerate.mockResolvedValue({
      text: JSON.stringify({
        title: 'Cyber Grassland Takeover',
        visualDirection: 'Chrome light beams over a campus lawn at dusk',
        posterPrompt:
          'Cyberpunk campus music festival poster, holographic stage, chrome haze, electric pink and acid green',
        caption:
          '⚡ Campus after dark. Neon grass, live bands, and a crowd ready to glow. Save your Friday night for the loudest lawn in town.',
        cta: 'RSVP before the gates open',
        hashtags: ['#EventForge', '#CampusFestival'],
      }),
    })
    mockGenerateImage.mockResolvedValue({
      images: [
        {
          base64: 'poster-base64',
          mediaType: 'image/png',
        },
      ],
    })

    const result = await generateMultimediaExperience(
      'Plan a cyberpunk campus music festival for 200 guests.',
    )

    expect(result).toEqual({
      brief: 'Plan a cyberpunk campus music festival for 200 guests.',
      concept: {
        title: 'Cyber Grassland Takeover',
        visualDirection: 'Chrome light beams over a campus lawn at dusk',
      },
      poster: {
        alt: 'Cyber Grassland Takeover poster',
        imageDataUrl: 'data:image/png;base64,poster-base64',
        prompt:
          'Cyberpunk campus music festival poster, holographic stage, chrome haze, electric pink and acid green',
        aspectRatio: DEFAULT_POSTER_ASPECT_RATIO,
      },
      socialCopy: {
        caption:
          '⚡ Campus after dark. Neon grass, live bands, and a crowd ready to glow. Save your Friday night for the loudest lawn in town.',
        cta: 'RSVP before the gates open',
        hashtags: ['#EventForge', '#CampusFestival'],
        shareText:
          '⚡ Campus after dark. Neon grass, live bands, and a crowd ready to glow. Save your Friday night for the loudest lawn in town.\n\nRSVP before the gates open\n#EventForge #CampusFestival',
      },
    })
  })

  it('falls back to default hashtags when the model output is missing them', async () => {
    mockGenerate.mockResolvedValue({
      text: JSON.stringify({
        title: 'After Hours Parade',
        visualDirection: 'Laser grids over a city skyline',
        posterPrompt: 'Retro-futurist skyline concert poster',
        caption: '🌃 Night shift energy meets a live crowd.',
        cta: 'Bring your crew',
      }),
    })
    mockGenerateImage.mockResolvedValue({
      images: [
        {
          base64: 'fallback-base64',
          mediaType: 'image/webp',
        },
      ],
    })

    const result = await generateMultimediaExperience(
      'Create a midnight launch party with synth-wave energy.',
    )

    expect(result.socialCopy.hashtags).toEqual(['#EventForge', '#LiveEvent'])
    expect(result.poster.imageDataUrl).toBe('data:image/webp;base64,fallback-base64')
  })

  it('uses ratio-specific image size when a portrait ratio is requested', async () => {
    mockGenerate.mockResolvedValue({
      text: JSON.stringify({
        title: 'Vertical Launch Poster',
        visualDirection: 'Tall composition with clear typography hierarchy',
        posterPrompt: 'Vertical event poster with title area, subtitle, and footer details',
        caption: '🎯 Story-first launch creatives for social reach.',
        cta: 'Claim your early-access pass',
        hashtags: ['#EventForge'],
      }),
    })
    mockGenerateImage.mockResolvedValue({
      images: [
        {
          base64: 'portrait-base64',
          mediaType: 'image/png',
        },
      ],
    })

    const result = await generateMultimediaExperience(
      'Build a launch poster optimized for vertical social formats.',
      { aspectRatio: '9:16' },
    )

    expect(result.poster.aspectRatio).toBe('9:16')
    expect(mockGenerateImage).toHaveBeenCalledWith(
      'Vertical event poster with title area, subtitle, and footer details',
      expect.objectContaining({ size: '864x1536' }),
    )
  })
})
