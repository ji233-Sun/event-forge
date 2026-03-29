'use client'

import { IconSparkles } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'

const TILE_ANIMATION_CLASSES = [
  'animate-pulse',
  'animate-pulse [animation-delay:120ms]',
  'animate-pulse [animation-delay:240ms]',
  'animate-pulse [animation-delay:360ms]',
]

export function SlidesGeneratingScreen() {
  return (
    <div className="relative flex h-[calc(100vh-3rem)] items-center justify-center overflow-hidden px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-8 right-12 h-56 w-56 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="mb-7 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            <IconSparkles className="size-4 animate-pulse" />
            Slide Rendering
          </div>
          <p className="mt-4 text-2xl font-semibold">Crafting your slides...</p>
          <p className="mt-1 text-sm text-muted-foreground">This usually takes 15-30 seconds</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {TILE_ANIMATION_CLASSES.map((animationClass, index) => (
            <div
              key={index}
              className={[
                'rounded-xl border border-border/70 bg-card/75 p-3 backdrop-blur-sm',
                animationClass,
              ].join(' ')}
            >
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border/70 bg-muted/35">
                <div className="absolute inset-0 space-y-3 p-4">
                  <Skeleton className="h-7 w-3/5" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
