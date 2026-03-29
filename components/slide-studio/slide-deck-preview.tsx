"use client";

import { memo, useMemo } from "react";
import { generateSampleMarkdown } from "@/lib/slides/marp-sample";
import type { TemplateValues } from "@/lib/slides/template/config";
import { SlideRenderer } from "@/components/slides/SlideRenderer";

interface SlideDeckPreviewProps {
  values: TemplateValues;
}

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
    <div className="h-full w-full">
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1.5">
        {previewSlides.map((slide, i) => (
          <div key={i} className="flex items-center justify-center overflow-hidden">
            <div className="aspect-video h-full max-h-full w-full">
              <SlideRenderer content={slide} templateValues={values} />
            </div>
          </div>
        ))}
        {/* Fill empty grid cells if fewer than 4 slides */}
        {Array.from({ length: Math.max(0, 4 - previewSlides.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center justify-center text-xs text-muted-foreground"
          />
        ))}
      </div>
    </div>
  );
});
