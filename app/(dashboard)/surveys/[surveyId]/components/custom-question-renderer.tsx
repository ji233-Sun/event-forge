'use client'

import { LiveProvider, LivePreview, LiveError } from 'react-live'
import { QUESTION_RUNTIME_SCOPE } from '@/lib/question-runtime/scope'

type Props = {
  code: string
  value?: unknown
  onChange?: (value: unknown) => void
  question?: { title: string; description: string | null }
  mode: 'form' | 'display'
  answer?: unknown
}

// Ensure noInline code always ends with a render() call.
// The AI system prompt instructs models to include it, but sometimes they omit it.
function ensureRenderCall(code: string, mode: 'form' | 'display'): string {
  if (/render\s*\(/.test(code)) return code
  const renderCall =
    mode === 'form'
      ? 'render(<Component value={value} onChange={onChange} question={question} />)'
      : 'render(<Display answer={answer} />)'
  return `${code}\n${renderCall}`
}

export function CustomQuestionRenderer({ code, value, onChange, question, mode, answer }: Props) {
  const scope = {
    ...QUESTION_RUNTIME_SCOPE,
    value: mode === 'form' ? value : undefined,
    onChange: mode === 'form' ? (onChange ?? (() => {})) : undefined,
    question,
    answer: mode === 'display' ? answer : undefined,
  }

  return (
    <LiveProvider code={ensureRenderCall(code, mode)} scope={scope} noInline>
      <LiveError className="rounded-md bg-destructive/10 p-2 text-xs text-destructive font-mono" />
      <LivePreview />
    </LiveProvider>
  )
}
