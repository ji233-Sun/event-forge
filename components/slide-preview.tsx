"use client";

import { useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { parseSlides } from "@/lib/slides";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import type { TemplateValues } from "@/lib/slides/template/config";
import {
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconX,
} from "@tabler/icons-react";

export interface SlidePreviewHandle {
  present(): void;
}

interface SlidePreviewProps {
  markdown: string;
  templateValues: TemplateValues;
  /** When this value changes, jump to that slide index */
  currentSlide?: number;
  /** Called whenever the active slide changes */
  onSlideChange?: (index: number) => void;
}

export const SlidePreview = forwardRef<SlidePreviewHandle, SlidePreviewProps>(
  function SlidePreview({ markdown, templateValues, currentSlide, onSlideChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [internalIndex, setInternalIndex] = useState(currentSlide ?? 0);
    const activeIndex = currentSlide ?? internalIndex;

    const slides = useMemo(() => parseSlides(markdown), [markdown]);
    const total = slides.length;

    const goTo = useCallback(
      (index: number) => {
        const clamped = Math.max(0, Math.min(total - 1, index));
        if (clamped === activeIndex) return;
        if (currentSlide === undefined) {
          setInternalIndex(clamped);
        }
        onSlideChange?.(clamped);
      },
      [activeIndex, currentSlide, total, onSlideChange],
    );

    // Keyboard navigation
    useEffect(() => {
      function handleKey(e: KeyboardEvent) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          goTo(activeIndex + 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          goTo(activeIndex - 1);
        }
      }
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [activeIndex, goTo]);

    // Fullscreen support
    useImperativeHandle(ref, () => ({
      present() {
        containerRef.current?.requestFullscreen?.().catch(() => {});
      },
    }));

    useEffect(() => {
      function onFsChange() {
        setIsFullscreen(!!document.fullscreenElement);
      }
      document.addEventListener("fullscreenchange", onFsChange);
      return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    if (total === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No slides
        </div>
      );
    }

    const slideContent = slides[activeIndex] ?? "";
    const slideAnimationClass = "h-full w-full animate-[slide-enter_420ms_cubic-bezier(.2,.7,.2,1)_both]";

    return (
      <div
        ref={containerRef}
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black p-3 md:p-4"
      >
        {/* Slide canvas — 16:9 responsive container */}
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="aspect-video w-full max-h-full max-w-full">
            <div
              key={activeIndex}
              className={slideAnimationClass}
            >
              <SlideRenderer content={slideContent} templateValues={templateValues} />
            </div>
          </div>
        </div>

        {/* Navigation bar */}
        <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-5 py-2 backdrop-blur-md">
          <button
            type="button"
            className="text-white/80 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed"
            disabled={activeIndex === 0}
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous slide"
            title="Previous slide"
          >
            <IconChevronLeft size={18} />
          </button>
          <span className="text-xs text-white/60">
            {activeIndex + 1} / {total}
          </span>
          <button
            type="button"
            className="text-white/80 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed"
            disabled={activeIndex === total - 1}
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next slide"
            title="Next slide"
          >
            <IconChevronRight size={18} />
          </button>
          <div className="ml-2 h-4 w-px bg-white/20" />
          <button
            type="button"
            className="text-white/80 hover:text-white"
            onClick={() =>
              isFullscreen
                ? document.exitFullscreen?.()
                : containerRef.current?.requestFullscreen?.()
            }
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <IconX size={16} /> : <IconMaximize size={16} />}
          </button>
        </div>

        {/* Inline keyframes */}
        <style>{`
          @keyframes slide-enter {
            from { opacity: 0; transform: translate3d(36px, 0, 0) scale(0.985); }
            to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
          }
        `}</style>
      </div>
    );
  },
);
