'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  IconArrowLeft,
  IconPresentation,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconPhoto,
  IconX,
  IconLoader2,
  IconRefresh,
  IconFileTypePdf,
  IconPresentation as IconPptx,
} from '@tabler/icons-react'
import type { ImageSlideState } from './image-types'
import { exportToPdf, exportToPptx } from '@/lib/export/slides'

interface ImageStudioViewProps {
  slides: ImageSlideState[]
  deckId?: string
  deckTitle?: string
  onBack: () => void
  onRetry?: (index: number) => void
}

type ExportState = 'idle' | 'exporting'

export function ImageStudioView({ slides, deckId, deckTitle = 'Slide Deck', onBack, onRetry }: ImageStudioViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPresenting, setIsPresenting] = useState(false)
  const [exportState, setExportState] = useState<ExportState>('idle')
  const presentRef = useRef<HTMLDivElement>(null)

  const doneSlides = slides.filter((s): s is ImageSlideState & { url: string } =>
    s.status === 'done' && !!s.url
  )
  const currentSlide = slides[currentIndex]

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(0, slides.length - 1)))
  }, [slides.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))
  }, [slides.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight' || e.key === ' ') goToNext()
      if (e.key === 'Escape' && isPresenting) exitPresent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goToPrev, goToNext, isPresenting])

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setIsPresenting(false)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function startPresent() {
    presentRef.current?.requestFullscreen().catch(() => {})
    setIsPresenting(true)
  }

  function exitPresent() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setIsPresenting(false)
  }

  async function handleExport(format: 'pdf' | 'pptx') {
    if (!deckId || doneSlides.length === 0 || exportState === 'exporting') return
    setExportState('exporting')
    try {
      if (format === 'pdf') {
        await exportToPdf(deckId, deckTitle)
      } else {
        await exportToPptx(deckId, deckTitle)
      }
    } finally {
      setExportState('idle')
    }
  }

  async function handleDownloadCurrent() {
    if (!currentSlide?.url) return
    const res = await fetch(currentSlide.url)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1] ?? 'png'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `slide-${currentSlide.index + 1}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  const isExporting = exportState === 'exporting'

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

          {/* Download current slide */}
          {currentSlide?.status === 'done' && currentSlide.url && (
            <Button variant="ghost" size="sm" onClick={handleDownloadCurrent}>
              <IconDownload className="mr-1 size-4" />
              Save
            </Button>
          )}

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!deckId || doneSlides.length === 0 || isExporting}
              >
                {isExporting ? (
                  <IconLoader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <IconDownload className="mr-1 size-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
                <IconChevronDown className="ml-1 size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <IconFileTypePdf className="mr-2 size-4 text-red-500" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('pptx')}
                disabled={isExporting}
              >
                <IconPptx className="mr-2 size-4 text-orange-500" />
                Export as PPTX
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  for (const s of doneSlides.sort((a, b) => a.index - b.index)) {
                    const res = await fetch(s.url)
                    const blob = await res.blob()
                    const ext = blob.type.split('/')[1] ?? 'png'
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `slide-${s.index + 1}.${ext}`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(a.href)
                  }
                }}
                disabled={isExporting}
              >
                <IconDownload className="mr-2 size-4" />
                Download Images
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            disabled={doneSlides.length === 0}
            onClick={startPresent}
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

          <NavArrows
            showPrev={currentIndex > 0}
            showNext={currentIndex < slides.length - 1}
            onPrev={goToPrev}
            onNext={goToNext}
          />

          <div className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
            {currentIndex + 1} / {slides.length}
          </div>
        </main>
      </div>

      {/* Fullscreen presentation layer */}
      <div
        ref={presentRef}
        className={[
          'fixed inset-0 z-50 flex items-center justify-center bg-black',
          isPresenting ? 'block' : 'hidden',
        ].join(' ')}
        onClick={goToNext}
      >
        {currentSlide?.status === 'done' && currentSlide.url && (
          <img
            src={currentSlide.url}
            alt={currentSlide.title}
            className="max-h-full max-w-full object-contain"
          />
        )}

        <NavArrows
          showPrev={currentIndex > 0}
          showNext={currentIndex < slides.length - 1}
          onPrev={(e) => { e.stopPropagation(); goToPrev() }}
          onNext={(e) => { e.stopPropagation(); goToNext() }}
        />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white/10 px-3 py-1 text-xs text-white/60 select-none">
          ESC to exit · ← → or click to navigate
        </div>

        <div className="absolute bottom-4 right-4 rounded bg-black/50 px-2 py-1 text-xs text-white">
          {currentIndex + 1} / {slides.length}
        </div>
      </div>
    </div>
  )
}

// ── Shared nav arrows ─────────────────────────────────────────────────────────

interface NavArrowsProps {
  showPrev: boolean
  showNext: boolean
  onPrev: (e: React.MouseEvent<HTMLButtonElement>) => void
  onNext: (e: React.MouseEvent<HTMLButtonElement>) => void
}

function NavArrows({ showPrev, showNext, onPrev, onNext }: NavArrowsProps) {
  return (
    <>
      {showPrev && (
        <button
          onClick={onPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Previous slide"
        >
          <IconChevronLeft className="size-5" />
        </button>
      )}
      {showNext && (
        <button
          onClick={onNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Next slide"
        >
          <IconChevronRight className="size-5" />
        </button>
      )}
    </>
  )
}
