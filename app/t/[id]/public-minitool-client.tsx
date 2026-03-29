'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MinitoolRenderer = dynamic(
  () => import('@/components/minitool-renderer').then((m) => m.MinitoolRenderer),
  { ssr: false, loading: () => <div className="h-screen animate-pulse bg-muted" /> },
)

const VISITOR_KEY = 'ef_visitor_id'

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

export function PublicMinitoolClient({
  minitoolId,
  componentCode,
}: {
  minitoolId: string
  componentCode: string
}) {
  const [visitorId, setVisitorId] = useState<string | null>(null)

  // Initialize visitorId client-side only (localStorage not available during SSR)
  useEffect(() => {
    setVisitorId(getOrCreateVisitorId())
  }, [])

  if (!visitorId) {
    return <div className="h-screen animate-pulse bg-muted" />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <MinitoolRenderer
          code={componentCode}
          minitoolId={minitoolId}
          mode="audience"
          visitorId={visitorId}
        />
      </div>
    </div>
  )
}
