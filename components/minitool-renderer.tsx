'use client'

import { useMemo } from 'react'
import { LiveProvider, LivePreview, LiveError } from 'react-live'
import { createMinitoolScope, createMinitoolPreviewScope } from '@/lib/minitool-runtime/scope'
import { LiveAutoFixer } from '@/components/live-auto-fixer'

type Mode = 'audience' | 'host' | 'preview-audience' | 'preview-host'

type Props = {
  code: string
  minitoolId: string
  mode: Mode
  visitorId?: string      // required for audience / preview-audience
  participantCount?: number  // passed to host component as convenience prop
  /** When provided, errors trigger AI auto-fix instead of displaying raw error text. */
  onFixed?: (fixedCode: string) => void
}

function ensureRenderCall(code: string, mode: Mode): string {
  if (/render\s*\(/.test(code)) return code
  if (mode === 'audience' || mode === 'preview-audience') {
    return `${code}\nrender(<Component visitorId={visitorId} />)`
  }
  return `${code}\nrender(<HostView participantCount={participantCount} />)`
}

function stripModuleSyntax(code: string): string {
  return code
    .replace(/^\s*import\s+.*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+/gm, '')
}

export function MinitoolRenderer({ code, minitoolId, mode, visitorId, participantCount, onFixed }: Props) {
  const scope = useMemo(() => {
    const isPreview = mode === 'preview-audience' || mode === 'preview-host'
    const base = isPreview
      ? createMinitoolPreviewScope(visitorId)
      : createMinitoolScope(minitoolId, visitorId ?? 'unknown')
    return { ...base, participantCount: participantCount ?? 0 }
  }, [minitoolId, visitorId, mode, participantCount])

  return (
    <LiveProvider
      code={ensureRenderCall(code, mode)}
      scope={scope}
      noInline
      transformCode={stripModuleSyntax}
    >
      {onFixed ? (
        <LiveAutoFixer originalCode={code} fixEndpoint="/api/fix-code" onFixed={onFixed} />
      ) : (
        <LiveError className="rounded-md bg-destructive/10 p-2 text-xs text-destructive font-mono" />
      )}
      <LivePreview />
    </LiveProvider>
  )
}
