"use client";

import { useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { buildSlideDoc } from "@/lib/slides/build-doc";

export interface SlidePreviewHandle {
  present(): void;
}

interface SlidePreviewProps {
  html: string;
  css: string;
  /** When this value changes, the iframe jumps to that slide index */
  currentSlide?: number;
  /** Called whenever the active slide changes inside the iframe */
  onSlideChange?: (index: number) => void;
}

export const SlidePreview = forwardRef<SlidePreviewHandle, SlidePreviewProps>(
  function SlidePreview({ html, css, currentSlide, onSlideChange }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      present() {
        iframeRef.current?.requestFullscreen().catch(() => {});
      },
    }));

    // Listen for slide-change messages from the iframe
    useEffect(() => {
      function handleMessage(e: MessageEvent) {
        if (e.data?.type === "slide-change" && typeof e.data.index === "number") {
          onSlideChange?.(e.data.index);
        }
      }
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, [onSlideChange]);

    // Jump the iframe to a specific slide when currentSlide changes
    useEffect(() => {
      if (currentSlide === undefined) return;
      iframeRef.current?.contentWindow?.postMessage(
        { type: "slide-goto", index: currentSlide },
        "*"
      );
    }, [currentSlide]);

    const fullDoc = useMemo(() => buildSlideDoc(html, css), [html, css]);

    return (
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          title="Slide Studio Viewer"
          srcDoc={fullDoc}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
        />
      </div>
    );
  }
);
