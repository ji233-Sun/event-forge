import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession, mockGenerateInstrumentalMusic } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGenerateInstrumentalMusic: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}))

vi.mock('@/lib/ai', () => ({
  generateInstrumentalMusic: mockGenerateInstrumentalMusic,
}))

import { POST } from './route'

describe('POST /api/multimedia/music', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({
          brief: 'Launch a rooftop event',
          conceptTitle: 'Rooftop Frequency',
          visualDirection: 'Mirrored lights over skyline',
          controls: {
            durationSeconds: 30,
            mood: 'cinematic',
            tempo: 'medium',
            instrumentation: 'synth',
          },
        }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Authentication required.',
    })
  })

  it('returns 400 when controls are invalid', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({
          brief: 'Launch a rooftop event',
          conceptTitle: 'Rooftop Frequency',
          visualDirection: 'Mirrored lights over skyline',
          controls: {
            durationSeconds: 29,
            mood: 'cinematic',
            tempo: 'medium',
            instrumentation: 'synth',
          },
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error:
        'Invalid music generation input. Please provide brief, poster direction, and valid controls.',
    })
    expect(mockGenerateInstrumentalMusic).not.toHaveBeenCalled()
  })

  it('returns a playable soundtrack payload on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockGenerateInstrumentalMusic.mockResolvedValue({
      previewUrl: 'data:audio/mpeg;base64,abc123',
      mediaType: 'audio/mpeg',
      durationMs: 30123,
      sizeBytes: 123456,
      traceId: 'trace-1',
    })

    const response = await POST(
      new Request('http://localhost/api/multimedia/music', {
        method: 'POST',
        body: JSON.stringify({
          brief: 'Launch a rooftop event',
          conceptTitle: 'Rooftop Frequency',
          visualDirection: 'Mirrored lights over skyline',
          controls: {
            durationSeconds: 30,
            mood: 'cinematic',
            tempo: 'medium',
            instrumentation: 'synth',
          },
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      soundtrack: {
        title: 'Cinematic Synth Instrumental',
        previewUrl: 'data:audio/mpeg;base64,abc123',
        durationLabel: '30s instrumental',
      },
    })
    expect(mockGenerateInstrumentalMusic).toHaveBeenCalledTimes(1)
  })
})
