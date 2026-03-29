'use client'

import { LiveProvider, LivePreview, LiveError } from 'react-live'
import { QUESTION_RUNTIME_SCOPE } from '@/lib/question-runtime/scope'
import { LiveAutoFixer } from '@/components/live-auto-fixer'

type Props = {
  code: string
  value?: unknown
  onChange?: (value: unknown) => void
  question?: { title: string; description: string | null }
  mode: 'form' | 'display'
  answer?: unknown
  /** When provided, errors trigger AI auto-fix instead of displaying raw error text. */
  onFixed?: (fixedCode: string) => void
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

// Strip import/export statements that the AI may include despite instructions.
// Sucrase's "imports" transform converts these to CommonJS (exports.xxx / require()),
// which are undefined in the browser sandbox, causing "exports is not defined".
function stripModuleSyntax(code: string): string {
  return code
    // Remove import lines: import X from 'Y', import { X } from 'Y', import 'Y'
    .replace(/^\s*import\s+.*$/gm, '')
    // Remove export default / export const / export function etc.
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+/gm, '')
}

export function CustomQuestionRenderer({ code, value, onChange, question, mode, answer, onFixed }: Props) {
  const scope = {
    ...QUESTION_RUNTIME_SCOPE,
    value: mode === 'form' ? value : undefined,
    onChange: mode === 'form' ? (onChange ?? (() => {})) : undefined,
    question,
    answer: mode === 'display' ? answer : undefined,
  }

  return (
    <LiveProvider code={ensureRenderCall(code, mode)} scope={scope} noInline transformCode={stripModuleSyntax}>
      {onFixed ? (
        <LiveAutoFixer originalCode={code} fixEndpoint="/api/fix-code" onFixed={onFixed} />
      ) : (
        <LiveError className="rounded-md bg-destructive/10 p-2 text-xs text-destructive font-mono" />
      )}
      <LivePreview />
    </LiveProvider>
  )
}
