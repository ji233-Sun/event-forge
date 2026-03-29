"use client";

import { memo, useMemo } from "react";
import { generateSampleMarkdown } from "@/lib/slides/marp-sample";
import type { TemplateValues } from "@/lib/slides/template/config";
import { SlideRenderer } from "@/components/slides/SlideRenderer";

interface SlideDeckPreviewProps {
  values: TemplateValues;
}

const PREVIEW_SCALE = "h-[161.3%] w-[161.3%] origin-top-left scale-[0.62]";

export const SlideDeckPreview = memo(function SlideDeckPreview({ values }: SlideDeckPreviewProps) {
  const markdown = generateSampleMarkdown(values);

  const slides = useMemo(() => {
    // Strip YAML front-matter, then split on ---
    const cleaned = markdown
      .replace(/^---\s*\n[\s\S]*?\n---\s*(\n|$)/, "")
      .trim();
    return cleaned
      .split(/\r?\n---\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [markdown]);

  // Show first 4 slides in a 2x2 grid
  const previewSlides = slides.slice(0, 4);

  return (
    <div className="flex h-full w-full items-center justify-center p-4 md:p-6">
      <div className="grid aspect-video w-full max-h-full max-w-full grid-cols-2 grid-rows-2 gap-2">
        {previewSlides.map((slide, i) => (
          <div key={i} className="aspect-video overflow-hidden rounded-sm border border-border/30 bg-black/80">
            <div className={`pointer-events-none ${PREVIEW_SCALE}`}>
              <SlideRenderer content={slide} templateValues={values} />
            </div>
          </div>
        ))}
        {/* Fill empty grid cells if fewer than 4 slides */}
        {Array.from({ length: Math.max(0, 4 - previewSlides.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-video rounded-sm border border-border/30 bg-muted/20 text-xs text-muted-foreground"
          />
        ))}
      </div>
    </div>
  );
});
