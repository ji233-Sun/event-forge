import type { ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { MultimediaResult } from './multimedia-result'

vi.mock('next/image', () => ({
  default: (props: ComponentProps<'img'>) => <img {...props} />,
}))

describe('MultimediaResult', () => {
  it('renders the simplified music generator without lyrics controls', () => {
    const markup = renderToStaticMarkup(
      <MultimediaResult
        copied={false}
        onCopy={() => undefined}
        result={{
          brief: 'Launch a campus live music festival.',
          concept: {
            title: 'Neon Pulse',
            visualDirection: 'Electric indie concert poster with cinematic lighting.',
          },
          poster: {
            alt: 'Festival poster',
            imageDataUrl: 'data:image/png;base64,abc123',
            prompt: 'Electric indie concert poster, cinematic lighting, neon gradients',
            aspectRatio: '16:9',
          },
          socialCopy: {
            caption: 'Save the date for Neon Pulse.',
            cta: 'Book your ticket now.',
            hashtags: ['#NeonPulse'],
            shareText: 'Neon Pulse is coming soon.',
          },
        }}
      />,
    )

    expect(markup).toContain('Soundtrack Match')
    expect(markup).toContain('Generate Music')
    expect(markup).not.toContain('Include Lyrics')
  })
})
