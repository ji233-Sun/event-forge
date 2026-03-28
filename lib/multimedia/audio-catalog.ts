import type { Soundtrack } from './types'

export const SOUNDTRACKS: Soundtrack[] = [
  {
    id: 'neon-pulse',
    title: 'Neon Pulse',
    description: 'A sleek electronic build for launch teasers and high-energy reveals.',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationLabel: 'Demo loop',
  },
  {
    id: 'chrome-afterglow',
    title: 'Chrome Afterglow',
    description: 'A cinematic synth groove for dusk events, show openings, and neon socials.',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationLabel: 'Demo loop',
  },
  {
    id: 'skyline-rush',
    title: 'Skyline Rush',
    description: 'A brighter electro drive for upbeat campaigns and audience countdowns.',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    durationLabel: 'Demo loop',
  },
]

export const DEFAULT_SOUNDTRACK_ID = SOUNDTRACKS[0].id

export function getSoundtrackById(id: string) {
  return SOUNDTRACKS.find((track) => track.id === id) ?? SOUNDTRACKS[0]
}
