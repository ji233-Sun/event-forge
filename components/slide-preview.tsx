"use client";

import { useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { parseSlides, getSlideTitle } from "@/lib/slides";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import type { TemplateValues } from "@/lib/slides/template/config";
import { DEFAULT_TEMPLATE_VALUES } from "@/lib/slides/template/config";
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
    const [direction, setDirection] = useState<"forward" | "backward">("forward");
    const [internalIndex, setInternalIndex] = useState(currentSlide ?? 0);
    const prevIndexRef = useRef(internalIndex);

    const slides = useMemo(() => parseSlides(markdown), [markdown]);
    const total = slides.length;

    // Sync external currentSlide to internal state
    useEffect(() => {
      if (currentSlide !== undefined && currentSlide !== internalIndex) {
        setDirection(currentSlide > internalIndex ? "forward" : "backward");
        setInternalIndex(currentSlide);
      }
    }, [currentSlide]);

    const goTo = useCallback(
      (index: number) => {
        const clamped = Math.max(0, Math.min(total - 1, index));
        if (clamped === internalIndex) return;
        setDirection(clamped > internalIndex ? "forward" : "backward");
        setInternalIndex(clamped);
        onSlideChange?.(clamped);
      },
      [internalIndex, total, onSlideChange],
    );

    // Keyboard navigation
    useEffect(() => {
      function handleKey(e: KeyboardEvent) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
          e.preventDefault();
          goTo(internalIndex + 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          goTo(internalIndex - 1);
        }
      }
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [internalIndex, goTo]);

    // Track direction for animation
    useEffect(() => {
      if (internalIndex !== prevIndexRef.current) {
        setDirection(internalIndex > prevIndexRef.current ? "forward" : "backward");
        prevIndexRef.current = internalIndex;
      }
    }, [internalIndex]);

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

    const slideContent = slides[internalIndex] ?? "";

    return (
      <div
        ref={containerRef}
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black"
      >
        {/* Slide canvas — 16:9 responsive container */}
        <div className="relative aspect-[16/9] h-full max-h-full w-auto max-w-full">
          <div
            key={internalIndex}
            className="h-full w-full animate-[slide-enter_420ms_cubic-bezier(.2,.7,.2,1)_both]"
            style={
              direction === "backward"
                ? { animationName: "slide-enter-backward" }
                : undefined
            }
          >
            <SlideRenderer content={slideContent} templateValues={templateValues} />
          </div>
        </div>

        {/* Navigation bar */}
        <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-5 py-2 backdrop-blur-md">
          <button
            type="button"
            className="text-white/80 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed"
            disabled={internalIndex === 0}
            onClick={() => goTo(internalIndex - 1)}
          >
            <IconChevronLeft size={18} />
          </button>
          <span className="text-xs text-white/60">
            {internalIndex + 1} / {total}
          </span>
          <button
            type="button"
            className="text-white/80 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed"
            disabled={internalIndex === total - 1}
            onClick={() => goTo(internalIndex + 1)}
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
          @keyframes slide-enter-backward {
            from { opacity: 0; transform: translate3d(-36px, 0, 0) scale(0.985); }
            to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
          }
        `}</style>
      </div>
    );
  },
);
