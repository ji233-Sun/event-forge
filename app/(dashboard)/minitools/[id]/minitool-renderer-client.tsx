'use client'

import dynamic from 'next/dynamic'

export const MinitoolRenderer = dynamic(
  () => import('@/components/minitool-renderer').then((m) => m.MinitoolRenderer),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" /> },
)
