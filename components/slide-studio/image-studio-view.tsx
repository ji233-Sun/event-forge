'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  IconArrowLeft,
  IconPresentation,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconX,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react'
import type { ImageSlideState } from './image-types'

interface ImageStudioViewProps {
  slides: ImageSlideState[]
  onBack: () => void
  onRetry?: (index: number) => void
}

export function ImageStudioView({ slides, onBack, onRetry }: ImageStudioViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const doneSlides = slides.filter((s) => s.status === 'done' && s.url)
  const currentSlide = slides[currentIndex]

  const goToPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))
  }, [slides.length])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrev, goToNext])

  async function downloadSlide(slide: ImageSlideState & { url: string }) {
    const res = await fetch(slide.url)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1] ?? 'png'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `slide-${slide.index + 1}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  async function handleDownloadAll() {
    for (const slide of doneSlides) {
      if (slide.url) await downloadSlide(slide as ImageSlideState & { url: string })
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <h1 className="text-sm font-semibold">Slide Studio</h1>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Image Mode
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{slides.length} slides</span>
          {doneSlides.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadAll}>
              <IconDownload className="mr-1 size-4" />
              Download All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!currentSlide?.url}
            onClick={() => {
              if (currentSlide?.url) window.open(currentSlide.url, '_blank')
            }}
          >
            <IconPresentation className="mr-1 size-4" />
            Present
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail strip */}
        <aside className="w-40 shrink-0 overflow-y-auto border-r">
          <div className="flex flex-col gap-2 px-2 py-3">
            {slides.map((slide, i) => (
              <div key={slide.index} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  aria-pressed={i === currentIndex}
                  className={[
                    'w-full overflow-hidden rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                    i === currentIndex
                      ? 'border-primary/60 ring-1 ring-primary/40'
                      : 'border-border hover:border-border/80',
                  ].join(' ')}
                >
                  {slide.status === 'done' && slide.url ? (
                    <img
                      src={slide.url}
                      alt={slide.title || `Slide ${i + 1}`}
                      className="aspect-video w-full object-cover"
                    />
                  ) : slide.status === 'failed' ? (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-muted/50 text-muted-foreground">
                      <IconX className="size-4 text-destructive" />
                      <span className="text-[9px]">Failed</span>
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground">
                      <IconLoader2 className="size-4 animate-spin opacity-50" />
                    </div>
                  )}
                </button>

                <p className="truncate px-0.5 text-[10px] text-muted-foreground">
                  <span className="opacity-60">{i + 1}. </span>
                  {slide.title || `Slide ${i + 1}`}
                </p>

                {slide.status === 'failed' && onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-full text-[10px]"
                    onClick={() => onRetry(slide.index)}
                  >
                    <IconRefresh className="mr-1 size-3" />
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Image viewer */}
        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
          {currentSlide?.status === 'done' && currentSlide.url ? (
            <img
              src={currentSlide.url}
              alt={currentSlide.title}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <IconPhoto className="size-12 opacity-30" />
              <p className="text-sm">
                {currentSlide?.status === 'failed' ? 'Generation failed' : 'Loading...'}
              </p>
            </div>
          )}

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Previous slide"
            >
              <IconChevronLeft className="size-5" />
            </button>
          )}
          {currentIndex < slides.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Next slide"
            >
              <IconChevronRight className="size-5" />
            </button>
          )}

          {/* Slide counter */}
          <div className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
            {currentIndex + 1} / {slides.length}
          </div>
        </main>
      </div>
    </div>
  )
}
