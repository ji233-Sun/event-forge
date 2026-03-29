import { describe, it, expect } from 'vitest'
import { parseSlides, getSlideTitle, joinSlides } from './slides'

import { parseSlides as parseSlidesNew } from './slides'

import { getSlideTitle as getSlideTitleNew } from './slides'

const SAMPLE_WITH_FM = `---
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

const SAMPLE_NO_FM = `# A

---

# B`

describe('parseSlides', () => {
  it('splits on --- separators', () => {
    const slides = parseSlides(SAMPLE_NO_FM)
    expect(slides).toHaveLength(2)
  })

  it('strips YAML front-matter before splitting', () => {
    const slides = parseSlides(SAMPLE_WITH_FM)
    expect(slides).toHaveLength(3)
    // Front-matter is stripped, segment 0 starts with the heading
    expect(slides[0]).toContain('# Title Slide')
    expect(slides[0]).not.toContain('marp: true')
  })

  it('handles markdown with no front-matter', () => {
    const slides = parseSlides('# A\n\n---\n\n# B')
    expect(slides).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    const slides = parseSlides('')
    expect(slides).toHaveLength(0)
  })

  it('returns empty array for front-matter only', () => {
    const slides = parseSlides('---\nmarp: true\n---')
    expect(slides).toHaveLength(0)
  })
})

describe('joinSlides', () => {
  it('round-trip: parseSlides → joinSlides produces equivalent split', () => {
    const segments = parseSlides(SAMPLE_NO_FM)
    const rejoined = joinSlides(segments)
    // Re-parsed segment count must match original
    expect(parseSlides(rejoined)).toHaveLength(2)
  })

  it('joins segments with --- separator', () => {
    const result = joinSlides(['# A', '# B', '# C'])
    expect(result).toBe('# A\n\n---\n\n# B\n\n---\n\n# C')
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
