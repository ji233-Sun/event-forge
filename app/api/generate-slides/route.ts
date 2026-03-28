import Marp from "@marp-team/marp-core";
import { generate } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { isPlainObject } from "@/lib/api-utils";
import { buildDynamicStyle, replaceMarkdownStyle, type Palette } from "@/lib/slides/template/css-builder";
import { DEFAULT_TEMPLATE_VALUES, type TemplateValues } from "@/lib/slides/template/config";
import { headers } from "next/headers";

function extractMarkdown(text: string): string {
  const mdCodeBlockMatch = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (mdCodeBlockMatch) {
    return mdCodeBlockMatch[1].trim();
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("---")) {
    return trimmed;
  }

  return trimmed;
}

function countMarpSlides(markdown: string): number {
  const body = markdown.replace(/^---\s*[\r\n]+[\s\S]*?[\r\n]+---\s*[\r\n]*/u, "");
  const separators = body.match(/(^|\r?\n)---\s*(?=\r?\n|$)/g);
  return 1 + (separators?.length ?? 0);
}

function isChineseLanguage(language: string): boolean {
  return /^(zh\b|zh-|chinese\b|中文|简体中文|繁體中文)/i.test(language.trim());
}

function isValidTemplateValues(v: unknown): v is TemplateValues {
  if (!isPlainObject(v)) return false;
  const keys: Array<keyof TemplateValues> = [
    "themeMode", "baseColor", "primaryColor", "bgStyle",
    "headingFont", "bodyFont", "cardStyle", "borderRadius",
  ];
  return keys.every((k) => typeof (v as Record<string, unknown>)[k] === "string");
}

function buildBaseSystemPrompt(language: string, templateCss: string, palette: Palette): string {
  const normalizedLanguage = language.trim() || "English";
  const isChinese = isChineseLanguage(normalizedLanguage);
  const label = isChinese ? "中文" : normalizedLanguage;
  const itemLengthRule = isChinese
    ? "Each list must have at most 4 items, and each item must stay within 18 Chinese characters."
    : "Each list must have at most 4 items, and each item should stay brief (roughly 8-12 words).";
  const coverRule = isChinese
    ? "Keep the cover title within 15 Chinese characters."
    : "Keep the cover title concise (roughly 3-8 words).";
  const unitsRule = isChinese
    ? "Use Chinese-friendly units such as 亿 and 万 where appropriate."
    : `Use units, number formatting, and terminology appropriate for ${normalizedLanguage}; do not fall back to Chinese-only units.`;
  const barCategories = isChinese
    ? ["场地", "设备", "宣传", "餐饮", "礼品"]
    : ["Venue", "Equipment", "Marketing", "Catering", "Merch"];
  const pieCategories = isChinese
    ? ["赞助", "门票", "周边", "其他"]
    : ["Sponsorship", "Tickets", "Merch", "Other"];
  const weekLabels = isChinese
    ? ["第1周", "第2周", "第3周", "第4周", "第5周", "第6周"]
    : ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
  const chartJsonPlaceholder = isChinese ? "柱状图JSON" : "bar chart JSON";
  const pieJsonPlaceholder = isChinese ? "饼图JSON" : "pie chart JSON";

  const indentedCss = templateCss.trim().split("\n").map((l) => `  ${l}`).join("\n");

  return `You are a top-tier presentation designer and information-visualization specialist. Generate a Marp Markdown slide deck.

Required:
- Output pure Marp Markdown only. No explanation or extra wrapper text.
- All slide copy must be written in ${label}.
- Use Marp front-matter directives for theme and styling.
- Separate each slide with ---.

Marp directives:
- Start with this exact YAML front-matter. Copy the style block verbatim — do NOT alter any values:

\`\`\`
---
marp: true
theme: default
paginate: true
style: |
${indentedCss}
---
\`\`\`

- The CSS theme above is already finalized. Do NOT override colors, fonts, or backgrounds. Generate slide content and layout only.

ECharts color values — use these EXACT hex literals in every chart (CSS variables are NOT allowed inside JSON):
- Primary: ${palette.primary}
- Secondary: ${palette.secondary}
- Accent: ${palette.accent}
- Muted text: ${palette.slideMuted}
- Main text: ${palette.slideText}

Slide structure:
- Include at least a cover, agenda, multiple content slides, and a closing slide.
- Generate at least 6 slides.
- Keep each slide focused on no more than 3 core points.
- Use at least 3 distinct layouts (cover, comparison, KPI cards, timeline, process list, etc.).
- Do not use plain bullet-list slides twice in a row.
- Use Marp directives (for example <!-- _class: cover -->) and HTML blocks for hierarchy.

Emphasis rules:
- Inside HTML blocks (<div>, <span>, custom panels), use <strong> for emphasis.
- In plain Markdown text, you may use **...**.

Overflow rules for a 1280×720 canvas:
- Keep the total visible lines per slide at or under 12.
- ${itemLengthRule}
- Chart slides should use one short supporting sentence plus one chart.
- Keep each column under 6 lines in two-column layouts.
- Use at most 3 KPI cards in one row.
- Split content across more slides instead of cramming.
- ${coverRule}

Copy rules:
- All slide copy must be written in ${label}.
- ${unitsRule}
- Keep the writing concise and presentation-ready.

Visual direction:
- Use cards, shadows, borders, and translucent panels for depth based on your CSS.
- Leave enough whitespace so each slide has a clear focal point.

ECharts rules:
- Use at least 2 slides with ECharts visualizations.
- Embed charts as <div id="chart-N" class="echarts-chart" data-option='JSON'></div>
- Each chart id must be unique.
- data-option must be valid JSON using double quotes.
- Always set "backgroundColor":"transparent".
- EXTREMELY IMPORTANT: Do NOT use CSS variables inside the ECharts JSON. You MUST use the exact literal HEX codes provided above.
- Set the "color" array to use your accent hex colors.
- Set axisLine.lineStyle.color and axisLabel.color to your muted text hex color.
- Use "splitLine":{"lineStyle":{"color":"rgba(128,128,128,0.2)"}}.
- Use "animationDuration":1200 and "animationEasing":"cubicInOut".
- Preferred chart types: bar, line with areaStyle, pie with donut radius.
- Put chart titles in h2/h3 above the chart instead of inside the option JSON.

Bar chart example:
<div id="chart-1" class="echarts-chart" data-option='{"color":["${palette.primary}","${palette.secondary}","${palette.accent}","${palette.slideMuted}","${palette.slideText}"],"backgroundColor":"transparent","tooltip":{},"grid":{"top":40,"bottom":30,"left":60,"right":20},"xAxis":{"type":"category","data":${JSON.stringify(barCategories)},"axisLine":{"lineStyle":{"color":"${palette.slideMuted}"}},"axisLabel":{"color":"${palette.slideMuted}"}},"yAxis":{"splitLine":{"lineStyle":{"color":"rgba(128,128,128,0.2)"}},"axisLabel":{"color":"${palette.slideMuted}"}},"series":[{"type":"bar","data":[15,20,10,25,8],"barWidth":"40%","animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

Donut chart example:
<div id="chart-2" class="echarts-chart" data-option='{"color":["${palette.primary}","${palette.secondary}","${palette.accent}","${palette.slideMuted}"],"backgroundColor":"transparent","tooltip":{"trigger":"item"},"legend":{"bottom":10,"textStyle":{"color":"${palette.slideMuted}"}},"series":[{"type":"pie","radius":["40%","70%"],"center":["50%","45%"],"data":[{"value":30,"name":"${pieCategories[0]}"},{"value":25,"name":"${pieCategories[1]}"},{"value":20,"name":"${pieCategories[2]}"},{"value":25,"name":"${pieCategories[3]}"}],"label":{"color":"${palette.slideText}"},"animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

Line chart example:
<div id="chart-3" class="echarts-chart" data-option='{"color":["${palette.primary}","${palette.secondary}","${palette.accent}"],"backgroundColor":"transparent","tooltip":{"trigger":"axis"},"grid":{"top":40,"bottom":30,"left":60,"right":20},"xAxis":{"type":"category","data":${JSON.stringify(weekLabels)},"axisLine":{"lineStyle":{"color":"${palette.slideMuted}"}},"axisLabel":{"color":"${palette.slideMuted}"}},"yAxis":{"splitLine":{"lineStyle":{"color":"rgba(128,128,128,0.2)"}},"axisLabel":{"color":"${palette.slideMuted}"}},"series":[{"type":"line","smooth":true,"areaStyle":{"opacity":0.15},"data":[50,120,200,350,500,800],"animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

Two-chart layout example:
<div class="chart-row">
<div id="chart-4" class="echarts-chart" data-option='${chartJsonPlaceholder}'></div>
<div id="chart-5" class="echarts-chart" data-option='${pieJsonPlaceholder}'></div>
</div>`;
}

function buildRetryConstraint(language: string): string {
  if (isChineseLanguage(language)) {
    return `硬性要求：
- 必须输出至少 6 页幻灯片
- front-matter 后至少出现 5 个页面分隔符（---）
- 严禁输出单页内容；如果内容不足，请自行补充目录页、方案页、预算页、时间线页、总结页`;
  }

  return `Hard requirement: output at least 6 slides.
- Include at least 5 slide separators (---) after the front-matter.
- Never return a single-slide deck.
- If the source material is thin, add an agenda, approach, budget, timeline, and closing slide.`;
}

async function generateMarpMarkdown(
  prompt: string,
  language: string,
  templateCss: string,
  palette: Palette,
  extraConstraint?: string
): Promise<{ text: string; finishReason: string }> {
  const { text, finishReason } = await generate("medium", prompt, {
    maxOutputTokens: 10000,
    system: [buildBaseSystemPrompt(language, templateCss, palette), extraConstraint].filter(Boolean).join("\n\n"),
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

  const { prompt, language, templateValues } = body as {
    prompt?: string;
    language?: string;
    templateValues?: unknown;
  };

  if (typeof prompt !== "string" || prompt.trim() === "") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const outputLanguage =
    typeof language === "string" && language.trim() ? language.trim() : "English";
  const trimmedPrompt = prompt.trim();
  const basePrompt = `Create a Marp Markdown slide deck in ${outputLanguage} based on the following event description:\n\n${trimmedPrompt}`;

  const resolvedValues: TemplateValues = isValidTemplateValues(templateValues)
    ? templateValues
    : DEFAULT_TEMPLATE_VALUES;
  const { style: templateCss, palette } = buildDynamicStyle(resolvedValues);

  let markdown: string;
  let slideCount: number;

  try {
    const { text, finishReason } = await generateMarpMarkdown(basePrompt, outputLanguage, templateCss, palette);

    if (finishReason === "length") {
      return Response.json(
        {
          error:
            "Model output was truncated due to token limit. Please retry with a shorter prompt or fewer slide details.",
        },
        { status: 502 }
      );
    }

    markdown = extractMarkdown(text);
    markdown = replaceMarkdownStyle(markdown, templateCss);
    slideCount = countMarpSlides(markdown);

    if (slideCount < 6) {
      const retry = await generateMarpMarkdown(
        basePrompt,
        outputLanguage,
        templateCss,
        palette,
        buildRetryConstraint(outputLanguage)
      );

      if (retry.finishReason === "length") {
        return Response.json(
          {
            error:
              "Model output was truncated due to token limit. Please retry with a shorter prompt or fewer slide details.",
          },
          { status: 502 }
        );
      }

      markdown = extractMarkdown(retry.text);
      markdown = replaceMarkdownStyle(markdown, templateCss);
      slideCount = countMarpSlides(markdown);
    }
  } catch (error) {
    console.error("[generate-slides] generation failed:", error);
    return Response.json(
      { error: "AI generation failed. Try again." },
      { status: 502 }
    );
  }

  if (!markdown) {
    return Response.json(
      { error: "Failed to parse model response as Marp Markdown" },
      { status: 502 }
    );
  }

  if (slideCount < 6) {
    return Response.json(
      {
        error:
          "Failed to generate a 6-slide minimum deck. Please retry with more detailed event information.",
      },
      { status: 502 }
    );
  }

  console.log("[generate-slides] generated markdown length:", markdown.length);
  console.log("[generate-slides] markdown slide count:", slideCount);

  let html: string;
  let css: string;
  try {
    // Server-side rendering with Marp Core
    const marp = new Marp({ html: true });
    ({ html, css } = marp.render(markdown));
  } catch (error) {
    console.error("[generate-slides] render failed:", error);
    return Response.json(
      { error: "Failed to render generated slides. Try again." },
      { status: 502 }
    );
  }

  console.log("[generate-slides] rendered slides, html length:", html.length);

  return Response.json({ html, css, markdown });
}
