"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { generateMarpMarkdown } from "../_lib/marp-sample";
import type { TemplateValues } from "../_lib/template-config";

type MarpRenderResponse = {
  html: string;
  css: string;
};

type RenderState = {
  error: string | null;
  html: string;
  css: string;
  resolvedMarkdown: string;
};

const INITIAL_RENDER_STATE: RenderState = {
  error: null,
  html: "",
  css: "",
  resolvedMarkdown: "",
};

const CANVAS_CSS = `
.slides-preview-root {
  height: 100%;
}

.slides-preview-gallery {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.slides-preview-card {
  border-radius: 16px;
  background: linear-gradient(160deg, #ffffff 0%, #e8eef7 100%);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slides-preview-stage {
  width: 1280px;
  height: 720px;
  transform-origin: center center;
}

.slides-preview-stage > .marpit,
.slides-preview-stage > section {
  width: 100%;
  height: 100%;
}

.slides-preview-stage > .marpit > svg,
.slides-preview-stage > section {
  display: block;
  width: 1280px;
  height: 720px;
  margin: 0;
}
`;

function collectSlides(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll(
      ":scope > section, :scope > svg, :scope > .marpit > section, :scope > .marpit > svg"
    )
  ) as HTMLElement[];
}

function createGalleryMarkup(rawHtml: string): string {
  const sandbox = document.createElement("div");
  sandbox.innerHTML = rawHtml;

  const slides = collectSlides(sandbox).slice(0, 4);
  if (slides.length === 0) {
    return rawHtml;
  }

  const gallery = document.createElement("div");
  gallery.className = "slides-preview-gallery";

  for (const slide of slides) {
    const card = document.createElement("article");
    card.className = "slides-preview-card";

    const stage = document.createElement("div");
    stage.className = "slides-preview-stage";

    let baseWidth = 1280;
    let baseHeight = 720;

    if (slide instanceof SVGElement) {
      const rawWidth = Number.parseFloat(slide.getAttribute("width") ?? "");
      const rawHeight = Number.parseFloat(slide.getAttribute("height") ?? "");
      const viewBox = slide.getAttribute("viewBox")?.trim().split(/\s+/);
      const viewBoxWidth = viewBox && viewBox.length === 4 ? Number.parseFloat(viewBox[2]) : Number.NaN;
      const viewBoxHeight = viewBox && viewBox.length === 4 ? Number.parseFloat(viewBox[3]) : Number.NaN;

      baseWidth = Number.isFinite(rawWidth) && rawWidth > 0
        ? rawWidth
        : Number.isFinite(viewBoxWidth) && viewBoxWidth > 0
          ? viewBoxWidth
          : 1280;
      baseHeight = Number.isFinite(rawHeight) && rawHeight > 0
        ? rawHeight
        : Number.isFinite(viewBoxHeight) && viewBoxHeight > 0
          ? viewBoxHeight
          : 720;
    } else {
      slide.style.width = "1280px";
      slide.style.height = "720px";
    }

    stage.dataset.baseWidth = String(baseWidth);
    stage.dataset.baseHeight = String(baseHeight);
    stage.style.width = `${baseWidth}px`;
    stage.style.height = `${baseHeight}px`;

    if (slide instanceof SVGElement) {
      const marpitWrapper = document.createElement("div");
      marpitWrapper.className = "marpit";
      marpitWrapper.appendChild(slide);
      stage.appendChild(marpitWrapper);
    } else {
      stage.appendChild(slide);
    }
    card.appendChild(stage);
    gallery.appendChild(card);
  }

  const container = document.createElement("div");
  container.appendChild(gallery);
  return container.innerHTML;
}

function scaleSlides(root: HTMLElement): void {
  const cards = Array.from(root.querySelectorAll(".slides-preview-card")) as HTMLElement[];
  let hasValidMeasurement = false;

  for (const card of cards) {
    const stage = card.querySelector(".slides-preview-stage") as HTMLElement | null;
    if (!stage) {
      continue;
    }

    const baseWidth = Number.parseFloat(stage.dataset.baseWidth ?? "1280");
    const baseHeight = Number.parseFloat(stage.dataset.baseHeight ?? "720");
    const safeWidth = Number.isFinite(baseWidth) && baseWidth > 0 ? baseWidth : 1280;
    const safeHeight = Number.isFinite(baseHeight) && baseHeight > 0 ? baseHeight : 720;
    const cardWidth = card.clientWidth;
    const cardHeight = card.clientHeight;

    // Avoid writing a zero scale when layout is not ready yet.
    if (cardWidth <= 0 || cardHeight <= 0) {
      continue;
    }

    const availableWidth = Math.max(0, cardWidth - 16);
    const availableHeight = Math.max(0, cardHeight - 16);
    if (availableWidth <= 0 || availableHeight <= 0) {
      continue;
    }

    hasValidMeasurement = true;
    const scale = Math.max(0.08, Math.min(availableWidth / safeWidth, availableHeight / safeHeight));
    stage.style.transform = `scale(${scale})`;
  }

  // If no card has width yet, keep previous scale and let caller retry next frame.
  if (!hasValidMeasurement) {
    return;
  }
}

function MarpPreviewImpl({ values }: { values: TemplateValues }) {
  const markdown = useMemo(() => generateMarpMarkdown(values), [values]);
  const [state, setState] = useState<RenderState>(INITIAL_RENDER_STATE);
  const isLoading = state.resolvedMarkdown !== markdown;
  const previewRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/slides-test/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ markdown }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          let message = "Failed to render preview";
          try {
            const payload = (await response.json()) as { error?: string };
            message = payload.error ?? message;
          } catch {
            // ignore invalid JSON payload
          }
          throw new Error(message);
        }

        return (await response.json()) as MarpRenderResponse;
      })
      .then((payload) => {
        const galleryHtml = createGalleryMarkup(payload.html);
        setState({
          error: null,
          html: galleryHtml,
          css: payload.css,
          resolvedMarkdown: markdown,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to render preview";
        setState((prev) => ({
          error: message,
          html: prev.html,
          css: prev.css,
          resolvedMarkdown: markdown,
        }));
      });

    return () => {
      controller.abort();
    };
  }, [markdown]);

  useEffect(() => {
    if (!previewRootRef.current || !state.html) {
      return;
    }

    const root = previewRootRef.current;
    const chartInstances: Array<{ resize: () => void; dispose: () => void }> = [];
    let disposed = false;
    let rafId = 0;
    let scaleRetryCount = 0;

    const onResize = () => {
      scaleSlides(root);
      for (const chart of chartInstances) {
        chart.resize();
      }
    };

    const queueScale = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        if (disposed) {
          return;
        }

        const cards = Array.from(
          root.querySelectorAll(".slides-preview-card")
        ) as HTMLElement[];
        const hasReadyCard = cards.some((card) => card.clientWidth > 0 && card.clientHeight > 0);

        onResize();

        if (!hasReadyCard && scaleRetryCount < 30) {
          scaleRetryCount += 1;
          queueScale();
        }
      });
    };

    const initCharts = async () => {
      const echartsModule = await import("echarts");
      if (disposed) {
        return;
      }

      const chartNodes = Array.from(
        root.querySelectorAll(".echarts-chart[data-option]")
      ) as HTMLDivElement[];

      for (const node of chartNodes) {
        const raw = node.getAttribute("data-option");
        if (!raw) {
          continue;
        }

        let attempts = 0;

        const initWhenReady = () => {
          if (disposed) {
            return;
          }

          const hasSize = node.clientWidth > 2 && node.clientHeight > 2;
          if (!hasSize) {
            if (attempts < 30) {
              attempts += 1;
              requestAnimationFrame(initWhenReady);
            }
            return;
          }

          try {
            const option = JSON.parse(raw) as Record<string, unknown>;
            const chart = echartsModule.init(node);
            chart.setOption(option);
            chartInstances.push(chart);
            chart.resize();
          } catch {
            // Skip invalid chart option JSON in preview mode.
          }
        };

        initWhenReady();
      }

      queueScale();
    };

    queueScale();
    void initCharts();

    window.addEventListener("resize", queueScale);
    const observer = new ResizeObserver(() => {
      queueScale();
    });
    observer.observe(root);

    return () => {
      disposed = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      window.removeEventListener("resize", queueScale);
      for (const chart of chartInstances) {
        chart.dispose();
      }
    };
  }, [state.html]);

  const previewPaneClassName = values.themeMode === "dark"
    ? "bg-zinc-900/95 border-zinc-700"
    : "bg-zinc-100 border-zinc-200";

  return (
    <div className={`flex h-full flex-col rounded-2xl border p-4 ${previewPaneClassName}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Live Preview</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900">Marp Sample Slides</h2>
        </div>
        {isLoading ? <span className="text-sm text-zinc-500">Rendering...</span> : null}
      </div>

      {state.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="mt-2 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200/70 p-3">
        {state.css && state.html ? (
          <>
            {/*
              Trust boundary: state.html and state.css come exclusively from the
              server-side /api/slides-test/render endpoint (authenticated, same-user
              session). Marp renders with html: false so raw HTML tags in markdown
              are escaped rather than passed through, preventing script injection.
              If html: true is ever re-enabled, sanitize state.html with DOMPurify
              before assigning it here, or isolate this in a sandboxed iframe.
            */}
            <style dangerouslySetInnerHTML={{ __html: `${state.css}\n${CANVAS_CSS}` }} />
            <div
              ref={previewRootRef}
              className="slides-preview-root h-full"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Preparing sample deck...
          </div>
        )}
      </div>
    </div>
  );
}

export const MarpPreview = memo(MarpPreviewImpl);
