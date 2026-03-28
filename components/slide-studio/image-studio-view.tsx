'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbnailStrip } from '@/components/slide-studio/thumbnail-strip'
import {
  IconArrowLeft,
  IconPresentation,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
} from '@tabler/icons-react'
import type { ImageSlideState } from './image-types'

export type { ImageSlideState } from './image-types'

interface ImageStudioViewProps {
  slides: ImageSlideState[]
  onBack: () => void
}

export function ImageStudioView({ slides, onBack }: ImageStudioViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const doneSlides = slides.filter((s) => s.status === 'done')
  const titles = slides.map((s, i) => s.title || `Slide ${i + 1}`)
  // ThumbnailStrip needs a string[] for slide segments — pass dummy strings (it ignores content)
  const dummySegments = slides.map(() => '')

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

  function handleDownloadAll() {
    doneSlides.forEach((slide) => {
      if (!slide.base64 || !slide.mediaType) return
      const ext = slide.mediaType.split('/')[1] ?? 'png'
      const a = document.createElement('a')
      a.href = `data:${slide.mediaType};base64,${slide.base64}`
      a.download = `slide-${slide.index + 1}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
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
            disabled={!currentSlide?.base64}
            onClick={() => {
              if (currentSlide?.base64 && currentSlide.mediaType) {
                const w = window.open('', '_blank')
                w?.document.write(
                  `<img src="data:${currentSlide.mediaType};base64,${currentSlide.base64}" style="width:100%;height:100%;object-fit:contain;background:#000">`,
                )
                w?.document.close()
              }
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
          <ThumbnailStrip
            slides={dummySegments}
            activeIndex={currentIndex}
            onSelect={setCurrentIndex}
            titles={titles}
          />
        </aside>

        {/* Image viewer */}
        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
          {currentSlide?.status === 'done' && currentSlide.base64 ? (
            <img
              src={`data:${currentSlide.mediaType};base64,${currentSlide.base64}`}
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
