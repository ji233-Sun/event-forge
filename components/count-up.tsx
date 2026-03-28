'use client'

import { useEffect, useState } from 'react'

export function CountUp({ end, duration = 1500, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let start = 0
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * end))
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
    return () => { start = end }
  }, [end, duration])

  return <>{value}{suffix}</>
}
