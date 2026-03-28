'use client'

import { useMemo } from 'react'

type TrendDay = { date: string; count: number }

function normalizeTrendData(data: TrendDay[] | undefined): TrendDay[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const dateRaw = (item as { date?: unknown }).date
    const countRaw = (item as { count?: unknown }).count
    const date = typeof dateRaw === 'string' ? dateRaw.trim() : ''
    const countCandidate = typeof countRaw === 'number' ? countRaw : Number(countRaw)
    const count = Number.isFinite(countCandidate) ? countCandidate : 0

    if (!date) {
      return []
    }

    return [{ date, count }]
  })
}

export function ResponseTrendChart({ data }: { data?: TrendDay[] }) {
  const safeData = useMemo(() => normalizeTrendData(data), [data])

  const maxCount = useMemo(() => {
    if (safeData.length === 0) {
      return 1
    }

    return Math.max(1, ...safeData.map((item) => item.count))
  }, [safeData])

  if (safeData.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
        No response trend data yet.
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full rounded-md border border-border/60 bg-background/40 px-3 py-3">
      <div className="flex h-full items-end gap-2">
        {safeData.map((item) => {
          const normalizedHeight = Math.max(8, Math.round((item.count / maxCount) * 150))

          return (
            <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">{item.count}</span>
              <div
                className="w-full rounded-t-sm bg-primary/75 transition-[height] duration-300"
                style={{ height: `${normalizedHeight}px` }}
                title={`${item.date}: ${item.count}`}
              />
              <span className="text-[10px] text-muted-foreground">{item.date}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
