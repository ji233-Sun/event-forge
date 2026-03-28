"use client";

import { memo, useEffect, useRef, useState } from "react";
import { generateMarpMarkdown } from "@/app/slides-test/_lib/marp-sample";
import type { TemplateValues } from "@/lib/slides/template/config";

// Bare grid — no card borders, no backgrounds, just the slides themselves
const CANVAS_CSS = `
.sdp-root { height: 100%; }

.sdp-gallery {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 6px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.sdp-card {
  overflow: hidden;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sdp-stage {
  width: 1280px;
  height: 720px;
  transform-origin: center center;
}

.sdp-stage > .marpit,
.sdp-stage > section {
  width: 100%;
  height: 100%;
}

.sdp-stage > .marpit > svg,
.sdp-stage > section {
  display: block;
  width: 1280px;
  height: 720px;
  margin: 0;
}
`;

type RenderState = {
  html: string;
  css: string;
  resolvedMarkdown: string;
  error: string | null;
};

const EMPTY: RenderState = { html: "", css: "", resolvedMarkdown: "", error: null };

function collectSlides(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll(
      ":scope > section, :scope > svg, :scope > .marpit > section, :scope > .marpit > svg"
    )
  ) as HTMLElement[];
}

function buildGallery(rawHtml: string): string {
  const sandbox = document.createElement("div");
  sandbox.innerHTML = rawHtml;

  const slides = collectSlides(sandbox).slice(0, 4);
  if (slides.length === 0) return rawHtml;

  const gallery = document.createElement("div");
  gallery.className = "sdp-gallery";

  for (const slide of slides) {
    const card = document.createElement("div");
    card.className = "sdp-card";

    const stage = document.createElement("div");
    stage.className = "sdp-stage";

    let w = 1280, h = 720;
    if (slide instanceof SVGElement) {
      const rw = Number.parseFloat(slide.getAttribute("width") ?? "");
      const rh = Number.parseFloat(slide.getAttribute("height") ?? "");
      const vb = slide.getAttribute("viewBox")?.trim().split(/\s+/);
      w = Number.isFinite(rw) && rw > 0 ? rw : (vb && Number.isFinite(+vb[2]) ? +vb[2] : 1280);
      h = Number.isFinite(rh) && rh > 0 ? rh : (vb && Number.isFinite(+vb[3]) ? +vb[3] : 720);
    } else {
      slide.style.width = "1280px";
      slide.style.height = "720px";
    }

    stage.dataset.w = String(w);
    stage.dataset.h = String(h);
    stage.style.width = `${w}px`;
    stage.style.height = `${h}px`;

    if (slide instanceof SVGElement) {
      const wrap = document.createElement("div");
      wrap.className = "marpit";
      wrap.appendChild(slide);
      stage.appendChild(wrap);
    } else {
      stage.appendChild(slide);
    }
    card.appendChild(stage);
    gallery.appendChild(card);
  }

  const root2 = document.createElement("div");
  root2.appendChild(gallery);
  return root2.innerHTML;
}

function scaleAll(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll(".sdp-card")) as HTMLElement[];
  let anyMeasured = false;
  for (const card of cards) {
    const stage = card.querySelector(".sdp-stage") as HTMLElement | null;
    if (!stage) continue;
    const bw = Number.parseFloat(stage.dataset.w ?? "1280") || 1280;
    const bh = Number.parseFloat(stage.dataset.h ?? "720") || 720;
    const cw = card.clientWidth, ch = card.clientHeight;
    if (cw <= 0 || ch <= 0) continue;
    anyMeasured = true;
    const scale = Math.max(0.05, Math.min((cw - 4) / bw, (ch - 4) / bh));
    stage.style.transform = `scale(${scale})`;
  }
  return anyMeasured ? undefined : undefined;
}

function SlideDeckPreviewImpl({ values }: { values: TemplateValues }) {
  const markdown = generateMarpMarkdown(values);
  const [state, setState] = useState<RenderState>(EMPTY);
  const rootRef = useRef<HTMLDivElement>(null);
  const isLoading = state.resolvedMarkdown !== markdown;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/slides-test/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown }),
      signal: ctrl.signal,
    })
      .then((r) => r.ok ? r.json() : r.json().then((e: { error?: string }) => Promise.reject(new Error(e.error ?? "render failed"))))
      .then((payload: { html: string; css: string }) => {
        setState({ error: null, html: buildGallery(payload.html), css: payload.css, resolvedMarkdown: markdown });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Failed", resolvedMarkdown: markdown }));
      });
    return () => ctrl.abort();
  }, [markdown]);

  useEffect(() => {
    if (!rootRef.current || !state.html) return;
    const root = rootRef.current;
    const chartInstances: Array<{ resize: () => void; dispose: () => void }> = [];
    let disposed = false;
    let raf = 0;
    let retries = 0;

    const rescale = () => {
      if (disposed) return;
      scaleAll(root);
      for (const chart of chartInstances) chart.resize();
      const cards = Array.from(root.querySelectorAll(".sdp-card")) as HTMLElement[];
      if (cards.some((c) => c.clientWidth <= 0) && retries < 30) {
        retries++;
        raf = requestAnimationFrame(rescale);
      }
    };

    const initCharts = async () => {
      const echarts = await import("echarts");
      if (disposed) return;
      const nodes = Array.from(root.querySelectorAll(".echarts-chart[data-option]")) as HTMLDivElement[];
      for (const node of nodes) {
        const raw = node.getAttribute("data-option");
        if (!raw) continue;
        let attempts = 0;
        const tryInit = () => {
          if (disposed) return;
          if (node.clientWidth <= 2 || node.clientHeight <= 2) {
            if (attempts++ < 30) requestAnimationFrame(tryInit);
            return;
          }
          try {
            const chart = echarts.init(node);
            chart.setOption(JSON.parse(raw) as Record<string, unknown>);
            chartInstances.push(chart);
            chart.resize();
          } catch { /* skip invalid JSON */ }
        };
        tryInit();
      }
      rescale();
    };

    raf = requestAnimationFrame(rescale);
    void initCharts();
    window.addEventListener("resize", rescale);
    const ro = new ResizeObserver(rescale);
    ro.observe(root);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", rescale);
      ro.disconnect();
      for (const chart of chartInstances) chart.dispose();
    };
  }, [state.html]);

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Rendering...</span>
        </div>
      )}
      {state.error && (
        <div className="flex h-full items-center justify-center text-xs text-destructive">
          {state.error}
        </div>
      )}
      {state.css && state.html ? (
        <>
          <style dangerouslySetInnerHTML={{ __html: `${state.css}\n${CANVAS_CSS}` }} />
          <div
            ref={rootRef}
            className="sdp-root h-full"
            dangerouslySetInnerHTML={{ __html: state.html }}
          />
        </>
      ) : (!state.error && (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Preparing preview…
        </div>
      ))}
    </div>
  );
}

export const SlideDeckPreview = memo(SlideDeckPreviewImpl);
