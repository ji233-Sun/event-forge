import { describe, it, expect } from 'vitest'
import { buildSlideDoc } from './build-doc'

describe('buildSlideDoc', () => {
  it('includes provided html', () => {
    const result = buildSlideDoc('<section>Hello</section>', 'body {}')
    expect(result).toContain('<section>Hello</section>')
  })

  it('includes provided css', () => {
    const result = buildSlideDoc('', 'body { color: red; }')
    expect(result).toContain('body { color: red; }')
  })

  it('shows slide 0 by default', () => {
    const result = buildSlideDoc('', '')
    expect(result).toContain('show(0);')
  })

  it('shows the specified startIndex slide', () => {
    const result = buildSlideDoc('', '', 5)
    expect(result).toContain('show(5);')
  })

  it('returns a string starting with <!DOCTYPE html>', () => {
    const result = buildSlideDoc('', '')
    expect(result.trimStart()).toMatch(/^<!DOCTYPE html>/)
  })
})
