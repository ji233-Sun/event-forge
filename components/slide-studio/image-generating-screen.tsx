'use client'

import { IconLoader2 } from '@tabler/icons-react'

type SlideStatus = 'pending' | 'done' | 'failed'

interface ImageGeneratingScreenProps {
  totalSlides: number
  slideStatuses: SlideStatus[]
}

export function ImageGeneratingScreen({
  totalSlides,
  slideStatuses,
}: ImageGeneratingScreenProps) {
  const completedCount = slideStatuses.filter((s) => s === 'done').length
  const progressPercent = totalSlides > 0 ? (completedCount / totalSlides) * 100 : 0

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center gap-6">
      <IconLoader2 className="size-10 animate-spin text-muted-foreground" />

      <div className="text-center">
        <p className="text-lg font-medium">Generating your image deck...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSlides > 0
            ? `${completedCount} / ${totalSlides} images complete`
            : 'Planning slides...'}
        </p>
      </div>

      {totalSlides > 0 && (
        <>
          <div className="w-64 overflow-hidden rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex gap-1.5">
            {slideStatuses.map((status, i) => (
              <div
                key={i}
                className={[
                  'h-4 w-7 rounded-sm border transition-colors duration-300',
                  status === 'done'
                    ? 'border-primary bg-primary/20'
                    : status === 'failed'
                      ? 'border-destructive bg-destructive/20'
                      : 'border-border bg-muted/30',
                ].join(' ')}
                title={`Slide ${i + 1}: ${status}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
