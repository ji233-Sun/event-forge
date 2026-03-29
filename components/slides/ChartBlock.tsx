"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { resolvePalette, type Palette } from "@/lib/slides/template/css-builder";
import type { TemplateValues } from "@/lib/slides/template/config";

interface ChartBlockProps {
  /** Raw JSON string from the ```echarts code block */
  raw: string;
  /** Current template values for color injection */
  templateValues: TemplateValues;
}

/**
 * Injects theme palette colors into an ECharts option object.
 * Replaces known placeholder keys with resolved palette colors.
 */
function injectThemeColors(
  option: Record<string, unknown>,
  palette: Palette,
): Record<string, unknown> {
  const result = structuredClone(option);

  // Auto-set color array if missing or using defaults
  if (
    !Array.isArray(result.color) ||
    (result.color as string[]).length === 0
  ) {
    result.color = [palette.primary, palette.secondary, palette.accent];
  }

  // Ensure transparent background
  result.backgroundColor = "transparent";

  return result;
}

export function ChartBlock({ raw, templateValues }: ChartBlockProps) {
  const palette = useMemo(() => resolvePalette(templateValues), [templateValues]);

  const option = useMemo(() => {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return injectThemeColors(parsed, palette);
    } catch {
      return null;
    }
  }, [raw, palette]);

  if (!option) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
        Invalid chart JSON
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: "100%" }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
}
