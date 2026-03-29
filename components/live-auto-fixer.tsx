'use client'

import { useEffect, useRef, useState } from 'react'
import { withLive } from 'react-live'
import { IconLoader2 } from '@tabler/icons-react'

const MAX_RETRIES = 2

type ExternalProps = {
  /** The raw code before any renderer transformations (e.g. ensureRenderCall). */
  originalCode: string
  fixEndpoint: string
  onFixed: (fixedCode: string) => void
}

type InnerProps = ExternalProps & { live: Record<string, unknown> }

function LiveAutoFixerInner({ originalCode, fixEndpoint, onFixed, live }: InnerProps) {
  const error = typeof live?.error === 'string' ? live.error : null

  const [isFixing, setIsFixing] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)

  const retriesRef = useRef(0)
  const attemptedRef = useRef(new Set<string>())
  // Keep onFixed stable to avoid re-triggering the effect
  const onFixedRef = useRef(onFixed)
  useEffect(() => { onFixedRef.current = onFixed }, [onFixed])

  // Reset retry counters whenever the underlying code changes (after a fix is applied)
  useEffect(() => {
    retriesRef.current = 0
    attemptedRef.current = new Set()
    setGaveUp(false)
    setIsFixing(false)
  }, [originalCode])

  useEffect(() => {
    if (!error || isFixing || gaveUp) return
    if (attemptedRef.current.has(error)) return
    if (retriesRef.current >= MAX_RETRIES) { setGaveUp(true); return }

    attemptedRef.current.add(error)
    retriesRef.current += 1
    setIsFixing(true)

    fetch(fixEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: originalCode, error }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.fixedCode && typeof data.fixedCode === 'string') {
          onFixedRef.current(data.fixedCode)
        } else {
          setGaveUp(true)
        }
      })
      .catch(() => setGaveUp(true))
      .finally(() => setIsFixing(false))
  }, [error, isFixing, gaveUp, originalCode, fixEndpoint])

  if (!error) return null

  if (isFixing) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        <IconLoader2 size={13} className="animate-spin shrink-0" />
        Auto-fixing error...
      </div>
    )
  }

  if (gaveUp) {
    // Show the raw error after exhausting retries
    return (
      <pre className="rounded-md bg-destructive/10 p-2 text-xs text-destructive font-mono whitespace-pre-wrap break-all">
        {error}
      </pre>
    )
  }

  // Brief transient state before the effect fires
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      <IconLoader2 size={13} className="animate-spin shrink-0" />
      Detecting error...
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LiveAutoFixer = withLive<ExternalProps>(LiveAutoFixerInner as any)
