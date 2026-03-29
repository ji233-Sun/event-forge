import { generate } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { isPlainObject } from "@/lib/api-utils";
import { resolvePalette, type Palette } from "@/lib/slides/template/css-builder";
import { DEFAULT_TEMPLATE_VALUES, TEMPLATE_OPTIONS, type TemplateValues } from "@/lib/slides/template/config";
import { headers } from "next/headers";

type DetailLevel = "concise" | "balanced" | "detailed";

const DETAIL_LEVEL_OPTIONS: readonly DetailLevel[] = ["concise", "balanced", "detailed"];

function resolveDetailLevel(value: unknown): DetailLevel {
  if (typeof value !== "string") return "detailed";
  const normalized = value.trim().toLowerCase();
  if ((DETAIL_LEVEL_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as DetailLevel;
  }
  return "detailed";
}

function extractMarkdown(text: string): string {
  const trimmed = text.trim();

  // If the text starts with a heading or list marker, it's likely direct markdown
  if (/^#{1,6}\s/m.test(trimmed) || /^[-*]\s/m.test(trimmed)) {
    return trimmed;
  }

  // Try to extract from a fenced code block with markdown/md language tag
  const mdCodeBlockMatch = trimmed.match(/```(?:markdown|md)\s*\n?([\s\S]*?)\n?```/i);
  if (mdCodeBlockMatch) {
    return mdCodeBlockMatch[1].trim();
  }

  // Strip any leading preamble (text before the first # heading)
  const firstHeading = trimmed.search(/^#{1,6}\s/m);
  if (firstHeading > 0) {
    return trimmed.slice(firstHeading).trim();
  }

  return trimmed;
}

function countSlides(markdown: string): number {
  // Strip YAML front-matter if present
  const cleaned = markdown
    .replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "")
    .trim();
  if (!cleaned) return 0;
  // Split by lines that contain only --- (with optional surrounding whitespace)
  const segments = cleaned.split(/\r?\n\s*---\s*\r?\n/);
  return segments.filter((s) => s.trim().length > 0).length;
}

function isChineseLanguage(language: string): boolean {
  return /^(zh\b|zh-|chinese\b|中文|简体中文|繁體中文)/i.test(language.trim());
}

function isValidTemplateValues(v: unknown): v is TemplateValues {
  if (!isPlainObject(v)) return false;
  return (Object.entries(TEMPLATE_OPTIONS) as Array<[keyof TemplateValues, readonly string[]]>).every(
    ([key, options]) => {
      const value = (v as Record<string, unknown>)[key];
      return typeof value === "string" && (options as readonly string[]).includes(value);
    },
  );
}

function buildBaseSystemPrompt(language: string, palette: Palette, slideCount: number, detailLevel: DetailLevel): string {
  const normalizedLanguage = language.trim() || "English";
  const isChinese = isChineseLanguage(normalizedLanguage);
  const label = isChinese ? "中文" : normalizedLanguage;
  const detailLabel = detailLevel === "concise"
    ? "Concise"
    : detailLevel === "balanced"
      ? "Balanced"
      : "Detailed";
  const itemLengthRule = isChinese
    ? detailLevel === "concise"
      ? "Each list must have at most 4 items, and each item must stay within 18 Chinese characters."
      : detailLevel === "balanced"
        ? "Each list must have at most 4 items, and each item should stay within 22 Chinese characters and include useful context."
        : "Each list must have at most 4 items, and each item should stay within 28 Chinese characters with concrete details or implications."
    : detailLevel === "concise"
      ? "Each list must have at most 4 items, and each item should stay brief (roughly 8-12 words)."
      : detailLevel === "balanced"
        ? "Each list must have at most 4 items, and each item should stay clear and informative (roughly 10-16 words)."
        : "Each list must have at most 4 items, and each item should include meaningful detail (roughly 12-22 words).";
  const coverRule = isChinese
    ? "Keep the cover title within 15 Chinese characters."
    : "Keep the cover title concise (roughly 3-8 words).";
  const unitsRule = isChinese
    ? "Use Chinese-friendly units such as 亿 and 万 where appropriate."
    : `Use units, number formatting, and terminology appropriate for ${normalizedLanguage}; do not fall back to Chinese-only units.`;
  const barCategories = isChinese
    ? ["场地", "设备", "宣传", "餐饮", "礼品"]
    : ["Venue", "Equipment", "Marketing", "Catering", "Merch"];

  const BT = "`";
  const tripleBT = BT + BT + BT;

  const depthRules = detailLevel === "concise"
    ? [
      "- Keep text lightweight while still actionable.",
      "- Each content slide should include at least one clear takeaway sentence.",
    ]
    : detailLevel === "balanced"
      ? [
        "- Each content slide should include a concise supporting explanation, not just keyword bullets.",
        "- Add one concrete example, metric, or implementation detail where possible.",
      ]
      : [
        "- Each content slide must include explanatory context, practical implications, and at least one concrete detail.",
        "- Expand sparse bullets into informative statements with specific outcomes, numbers, or examples.",
        "- Chart slides should include a chart plus 2 short interpretation sentences (insight + action).",
      ];

  const chartExample = JSON.stringify({
    color: [palette.primary, palette.secondary, palette.accent, palette.slideMuted, palette.slideText],
    backgroundColor: "transparent",
    tooltip: {},
    grid: { top: 40, bottom: 30, left: 60, right: 20 },
    xAxis: {
      type: "category",
      data: barCategories,
      axisLine: { lineStyle: { color: palette.slideMuted } },
      axisLabel: { color: palette.slideMuted },
    },
    yAxis: {
      splitLine: { lineStyle: { color: "rgba(128,128,128,0.2)" } },
      axisLabel: { color: palette.slideMuted },
    },
    series: [{ type: "bar", data: [15, 20, 10, 25, 8], barWidth: "40%", animationDuration: 1200, animationEasing: "cubicInOut" }],
  });

  return [
    "You are a top-tier presentation designer and information-visualization specialist. Generate a pure Markdown slide deck.",
    "",
    "Required:",
    "- Output pure Markdown only. No explanation or extra wrapper text.",
    "- Do NOT wrap your entire output in a code block. Output raw Markdown directly.",
    "- All slide copy must be written in " + label + ".",
    "- Depth mode: " + detailLabel + ".",
    "- Separate each slide with ---.",
    "- Do NOT output raw HTML tags. Use standard Markdown syntax only.",
    "- Do NOT include any YAML front-matter block (no --- YAML header).",
    "",
    "ECharts color values - use these EXACT hex literals in every chart:",
    "- Primary: " + palette.primary,
    "- Secondary: " + palette.secondary,
    "- Accent: " + palette.accent,
    "- Muted text: " + palette.slideMuted,
    "- Main text: " + palette.slideText,
    "",
    "Slide structure:",
    "- Include at least a cover, agenda, multiple content slides, and a closing slide.",
    "- Generate exactly " + slideCount + " slides. Keep each slide focused on no more than 3 core points.",
    "- Use at least 3 distinct layouts (cover, comparison, KPI cards, timeline, process list, etc.).",
    "- Do not use plain bullet-list slides twice in a row.",
    "",
    "Emphasis rules:",
    "- Use **...** for emphasis in Markdown text.",
    "",
    "Overflow rules for a 1280x720 canvas:",
    "- Keep the total visible lines per slide at or under 12.",
    "- " + itemLengthRule,
    "- Chart slides should include chart context text, not only raw chart data.",
    "- Keep each column under 6 lines in two-column layouts.",
    "- Use at most 3 KPI cards in one row.",
    "- Split content across more slides instead of cramming.",
    "- " + coverRule,
    "",
    "Content depth rules:",
    ...depthRules,
    "",
    "Copy rules:",
    "- All slide copy must be written in " + label + ".",
    "- " + unitsRule,
    "- Keep the writing presentation-ready with meaningful explanatory detail.",
    "",
    "Visual direction:",
    "- Use emphasis, horizontal rules (---), and code blocks for visual separation.",
    "- Leave enough whitespace so each slide has a clear focal point.",
    "",
    "ECharts rules:",
    "- Use exactly 1 slide with an ECharts bar chart.",
    "- Embed as a fenced code block with language " + BT + "echarts" + BT + " containing valid JSON.",
    '- Set axisLine.lineStyle.color and axisLabel.color to your muted text hex color.',
    '- Use "splitLine":{"lineStyle":{"color":"rgba(128,128,128,0.2)"}}.',
    '- Use "animationDuration":1200 and "animationEasing":"cubicInOut".',
    "- Preferred chart types: bar, line with areaStyle, pie with donut radius.",
    "- Put chart titles in ## heading above the chart, not inside the option JSON.",
    "",
    "Bar chart EXAMPLE (do NOT copy verbatim, create your own data):",
    tripleBT + "echarts",
    chartExample,
    tripleBT,
    "",
    "Now generate the slide deck based on the user's event description. Start directly with the first slide heading.",
  ].join("\n");
}

function buildRetryConstraint(language: string, slideCount: number, detailLevel: DetailLevel): string {
  const minSeparators = slideCount - 1;
  const detailExpansionRule = detailLevel === "detailed"
    ? "- Expand sparse slides with concrete examples, numbers, and actionable details."
    : "- Expand sparse slides with concise explanatory details.";
  if (isChineseLanguage(language)) {
    return [
      "Hard requirement: output at least " + slideCount + " slides.",
      "- Include at least " + minSeparators + " slide separators (---).",
      "- If the source material is thin, add an agenda, content, and closing slide.",
      detailExpansionRule,
    ].join("\n");
  }
  return [
    "Hard requirement: output at least " + slideCount + " slides.",
    "- Include at least " + minSeparators + " slide separators (---).",
    "- Never return a single-slide deck.",
    "- If the source material is thin, add an agenda, approach, budget, timeline, and closing slide.",
    detailExpansionRule,
  ].join("\n");
}
async function generateMarkdown(
  prompt: string,
  language: string,
  palette: Palette,
  slideCount: number,
  detailLevel: DetailLevel,
  extraConstraint?: string,
): Promise<{ text: string; finishReason: string }> {
  const maxOutputTokens = detailLevel === "concise" ? 9000 : detailLevel === "balanced" ? 11000 : 13000;
  const { text, finishReason } = await generate("medium", prompt, {
    maxOutputTokens,
    system: [buildBaseSystemPrompt(language, palette, slideCount, detailLevel), extraConstraint].filter(Boolean).join("\n\n"),
  });

  return {
    text,
    finishReason: String(finishReason ?? "unknown"),
  };
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, language, templateValues, slideCount: rawSlideCount, detailLevel: rawDetailLevel } = body as {
    prompt?: string;
    language?: string;
    templateValues?: unknown;
    slideCount?: unknown;
    detailLevel?: unknown;
  };

  if (typeof prompt !== "string" || prompt.trim() === "") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const outputLanguage =
    typeof language === "string" && language.trim() ? language.trim() : "English";
  const trimmedPrompt = prompt.trim();
  const basePrompt = `Create a Markdown slide deck in ${outputLanguage} based on the following event description:

${trimmedPrompt}`;

  const resolvedValues: TemplateValues = isValidTemplateValues(templateValues)
    ? templateValues
    : DEFAULT_TEMPLATE_VALUES;
  const palette = resolvePalette(resolvedValues);

  // Clamp slide count to [4, 16], default 8
  const requestedSlideCount = typeof rawSlideCount === "number" && Number.isInteger(rawSlideCount)
    ? Math.max(4, Math.min(16, rawSlideCount))
    : 8;
  const detailLevel = resolveDetailLevel(rawDetailLevel);

  let markdown: string;
  let slideCount: number;

  try {
    const { text, finishReason } = await generateMarkdown(basePrompt, outputLanguage, palette, requestedSlideCount, detailLevel);

    if (finishReason === "length") {
      return Response.json(
        {
          error:
            "Model output was truncated due to token limit. Please retry with a shorter prompt or fewer slide details.",
        },
        { status: 502 },
      );
    }

    markdown = extractMarkdown(text);
    slideCount = countSlides(markdown);
    console.log("[generate-slides] first attempt slide count:", slideCount, "requested:", requestedSlideCount, "markdown length:", markdown.length);
    if (slideCount < requestedSlideCount) {
      console.log("[generate-slides] first 200 chars:", markdown.substring(0, 200));
    }

    if (slideCount < requestedSlideCount) {
      const retry = await generateMarkdown(
        basePrompt,
        outputLanguage,
        palette,
        requestedSlideCount,
        detailLevel,
        buildRetryConstraint(outputLanguage, requestedSlideCount, detailLevel),
      );

      if (retry.finishReason === "length") {
        return Response.json(
          {
            error:
              "Model output was truncated due to token limit. Please retry with a shorter prompt or fewer slide details.",
          },
          { status: 502 },
        );
      }

      markdown = extractMarkdown(retry.text);
      slideCount = countSlides(markdown);
    }
  } catch (error) {
    console.error("[generate-slides] generation failed:", error);
    return Response.json(
      { error: "AI generation failed. Try again." },
      { status: 502 },
    );
  }

  if (!markdown) {
    return Response.json(
      { error: "Failed to parse model response as Markdown" },
      { status: 502 },
    );
  }

  if (slideCount < 4) {
    return Response.json(
      {
        error:
          `Failed to generate the requested ${requestedSlideCount}-slide deck (got ${slideCount}). Please retry with more detailed event information.`,
      },
      { status: 502 },
    );
  }

  console.log("[generate-slides] generated markdown length:", markdown.length);
  console.log("[generate-slides] slide count:", slideCount);

  return Response.json({ markdown });
}
