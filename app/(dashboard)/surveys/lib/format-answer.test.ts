import { describe, it, expect } from 'vitest'
import { formatAnswer, getPreview } from './format-answer'

describe('formatAnswer', () => {
  it('returns — for null', () => expect(formatAnswer(null)).toBe('—'))
  it('returns — for undefined', () => expect(formatAnswer(undefined)).toBe('—'))
  it('returns — for empty string', () => expect(formatAnswer('')).toBe('—'))
  it('joins arrays with comma', () => expect(formatAnswer(['a', 'b'])).toBe('a, b'))
  it('stringifies objects', () => expect(formatAnswer({ x: 1 })).toBe('{"x":1}'))
  it('converts string to string', () => expect(formatAnswer('hello')).toBe('hello'))
  it('converts number to string', () => expect(formatAnswer(42)).toBe('42'))
})

describe('getPreview', () => {
  const questions = [
    { id: 'q1' },
    { id: 'q2' },
    { id: 'q3' },
  ]

  it('returns first non-empty answer', () => {
    expect(getPreview({ q1: '', q2: 'Sam', q3: 'other' }, questions)).toBe('Sam')
  })

  it('returns — when all answers are empty', () => {
    expect(getPreview({ q1: null, q2: undefined, q3: '' }, questions)).toBe('—')
  })

  it('returns — when answers is empty', () => {
    expect(getPreview({}, questions)).toBe('—')
  })

  it('formats array answer', () => {
    expect(getPreview({ q1: ['a', 'b'] }, questions)).toBe('a, b')
  })
})
