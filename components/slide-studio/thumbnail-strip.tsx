"use client";

interface ThumbnailStripProps {
  /** Parsed slide segments (from parseSlides) */
  slides: string[];
  /** 0-based index of the currently active slide */
  activeIndex: number;
  /** Called when user clicks a thumbnail */
  onSelect: (index: number) => void;
  /** Display title per slide, length === slides.length */
  titles: string[];
}

export function ThumbnailStrip({
  slides,
  activeIndex,
  onSelect,
  titles,
}: ThumbnailStripProps) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto py-3 px-2">
      {slides.map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-pressed={i === activeIndex}
          className={[
            "w-full text-left rounded-md border px-3 py-2 text-xs transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            i === activeIndex
              ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-300"
              : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:bg-muted/50",
          ].join(" ")}
        >
          <div className="font-medium text-[10px] opacity-60 mb-0.5">
            {i + 1}
          </div>
          <div className="truncate">{titles[i]}</div>
        </button>
      ))}
    </div>
  );
}
