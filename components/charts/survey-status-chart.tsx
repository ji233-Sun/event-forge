'use client'

import { useMemo } from 'react'

type StatusData = { draft: number; published: number; closed: number }

export function SurveyStatusChart({ data }: { data?: StatusData }) {
  const safeData = useMemo(
    () => ({
      draft: data?.draft ?? 0,
      published: data?.published ?? 0,
      closed: data?.closed ?? 0,
    }),
    [data],
  )
  const total = safeData.draft + safeData.published + safeData.closed

  const rows = [
    {
      key: 'Draft',
      value: safeData.draft,
      trackClass: 'bg-[var(--chart-2)]',
    },
    {
      key: 'Published',
      value: safeData.published,
      trackClass: 'bg-[var(--chart-1)]',
    },
    {
      key: 'Closed',
      value: safeData.closed,
      trackClass: 'bg-[var(--chart-5)]',
    },
  ]

  return (
    <div className="h-[220px] w-full rounded-md border border-border/60 bg-background/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold tabular-nums">{total}</span>
      </div>

      <div className="space-y-4">
        {rows.map((row) => {
          const percent = total > 0 ? Math.round((row.value / total) * 100) : 0
          return (
            <div key={row.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{row.key}</span>
                <span className="tabular-nums text-foreground">{row.value} ({percent}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${row.trackClass}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
