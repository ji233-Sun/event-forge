export function formatAnswer(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function getPreview(
  answers: Record<string, unknown>,
  questions: { id: string }[],
): string {
  for (const q of questions) {
    const value = answers[q.id]
    if (value !== undefined && value !== null && value !== '') {
      return formatAnswer(value)
    }
  }
  return '—'
}
