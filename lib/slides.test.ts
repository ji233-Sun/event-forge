import { describe, it, expect } from 'vitest'
import { parseSlides, getSlideTitle, joinSlides } from './slides'

const SAMPLE = `---
marp: true
theme: default
---

# Title Slide

---

## Agenda

- Item 1
- Item 2

---

# Conclusion
`

describe('parseSlides', () => {
  it('returns one segment per slide', () => {
    const slides = parseSlides(SAMPLE)
    expect(slides).toHaveLength(3)
  })

  it('segment 0 includes front-matter', () => {
    const slides = parseSlides(SAMPLE)
    expect(slides[0]).toContain('marp: true')
    expect(slides[0]).toContain('# Title Slide')
  })

  it('segment 1 does not include front-matter', () => {
    const slides = parseSlides(SAMPLE)
    expect(slides[1]).not.toContain('marp: true')
    expect(slides[1]).toContain('## Agenda')
  })

  it('handles markdown with no front-matter', () => {
    const slides = parseSlides('# A\n\n---\n\n# B')
    expect(slides).toHaveLength(2)
  })
})

describe('joinSlides', () => {
  it('round-trip: parseSlides → joinSlides produces re-renderable markdown', () => {
    const segments = parseSlides(SAMPLE)
    const rejoined = joinSlides(segments)
    // Re-parsed segment count must match original
    expect(parseSlides(rejoined)).toHaveLength(3)
    // Front-matter must be preserved
    expect(rejoined).toContain('marp: true')
    // All headings must be present
    expect(rejoined).toContain('# Title Slide')
    expect(rejoined).toContain('## Agenda')
    expect(rejoined).toContain('# Conclusion')
  })
})

describe('getSlideTitle', () => {
  it('extracts h1 heading', () => {
    expect(getSlideTitle('# Hello World', 'Slide 1')).toBe('Hello World')
  })

  it('extracts h2 heading when no h1', () => {
    expect(getSlideTitle('## Agenda\n- item', 'Slide 2')).toBe('Agenda')
  })

  it('returns fallback when no heading', () => {
    expect(getSlideTitle('- bullet\n- point', 'Slide 3')).toBe('Slide 3')
  })
})
