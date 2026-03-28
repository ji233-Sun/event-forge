import Marp from "@marp-team/marp-core";
import { generate } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

function buildBaseSystemPrompt(language: string): string {
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

  return `You are a top-tier presentation designer and information-visualization specialist. Generate a Marp Markdown slide deck that feels technological, dimensional, and layered, while avoiding template-like or overly repetitive bullet lists.

Required:
- Output pure Marp Markdown only. No explanation or extra wrapper text.
- All slide copy must be written in ${label}.
- Use Marp front-matter directives for theme and styling.
- Separate each slide with ---.

Marp directives:
- Start with a YAML front-matter block:
  marp: true
  theme: default
  paginate: true
  style: |
    :root {
      --bg-0: #070b1f;
      --bg-1: #101a3c;
      --cyan: #36f5ff;
      --mint: #5effc7;
      --violet: #b47bff;
      --text: #e9efff;
      --muted: #9fb0d7;
    }
    section {
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      color: var(--text);
      background:
        radial-gradient(1200px 500px at 20% -10%, rgba(54,245,255,.18), transparent 60%),
        radial-gradient(1000px 500px at 100% 0%, rgba(180,123,255,.20), transparent 55%),
        linear-gradient(140deg, var(--bg-0) 0%, var(--bg-1) 100%);
      padding: 44px 56px;
      line-height: 1.45;
    }
    section::before {
      content: "";
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(94,255,199,.22);
      border-radius: 18px;
      pointer-events: none;
      box-shadow: inset 0 0 40px rgba(54,245,255,.06);
    }
    h1, h2, h3 {
      margin: 0 0 14px;
      letter-spacing: .5px;
      text-shadow: 0 0 18px rgba(54,245,255,.20);
    }
    h1 { color: var(--cyan); font-size: 54px; text-align: left; }
    h2 { color: var(--violet); font-size: 40px; }
    h3 { color: var(--mint); font-size: 30px; }
    p, li { font-size: 23px; }
    ul { margin: 8px 0 0; }
    strong { color: var(--cyan); }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 14px;
    }
    .kpi {
      padding: 16px 14px;
      border-radius: 14px;
      background: linear-gradient(160deg, rgba(255,255,255,.10), rgba(255,255,255,.03));
      border: 1px solid rgba(54,245,255,.25);
      box-shadow: 0 8px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.05);
    }
    .kpi .label { font-size: 16px; color: var(--muted); margin-bottom: 6px; }
    .kpi .value { font-size: 34px; color: var(--mint); font-weight: 700; }
    .panel {
      margin-top: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(180,123,255,.35);
      background: rgba(16,26,60,.55);
      backdrop-filter: blur(6px);
      box-shadow: 0 10px 24px rgba(6,10,30,.35);
    }
    .two-col {
      display: grid;
      grid-template-columns: 1.15fr .85fr;
      gap: 20px;
      align-items: start;
    }
    .timeline-item {
      margin: 10px 0;
      padding-left: 12px;
      border-left: 3px solid rgba(94,255,199,.7);
    }
    .cover h1 { font-size: 64px; text-align: center; margin-top: 40px; }
    .cover p { text-align: center; color: var(--mint); font-size: 30px; }
    .echarts-chart { width: 100%; height: 280px; border-radius: 14px; background: linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02)); border: 1px solid rgba(54,245,255,.18); box-shadow: 0 4px 20px rgba(0,0,0,.3); padding: 6px; }
    .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
    .chart-row .echarts-chart { height: 250px; }

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
- Tech-forward, futuristic, cool-toned.
- Use cards, shadows, borders, and translucent panels for depth.
- Leave enough whitespace so each slide has a clear focal point.

ECharts rules:
- Use at least 2 slides with ECharts visualizations.
- Embed charts as <div id="chart-N" class="echarts-chart" data-option='JSON'></div>
- Each chart id must be unique.
- data-option must be valid JSON using double quotes.
- Always set "backgroundColor":"transparent".
- Use "color":["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"].
- Use axisLine.lineStyle.color:"#9fb0d7" and axisLabel.color:"#9fb0d7".
- Use splitLine.lineStyle.color:"rgba(255,255,255,0.06)".
- Use "animationDuration":1200 and "animationEasing":"cubicInOut".
- Preferred chart types: bar, line with areaStyle, pie with donut radius.
- Put chart titles in h2/h3 above the chart instead of inside the option JSON.

Bar chart example:
<div id="chart-1" class="echarts-chart" data-option='{"color":["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"],"backgroundColor":"transparent","tooltip":{},"grid":{"top":40,"bottom":30,"left":60,"right":20},"xAxis":{"type":"category","data":${JSON.stringify(barCategories)},"axisLine":{"lineStyle":{"color":"#9fb0d7"}},"axisLabel":{"color":"#9fb0d7"}},"yAxis":{"splitLine":{"lineStyle":{"color":"rgba(255,255,255,0.06)"}},"axisLabel":{"color":"#9fb0d7"}},"series":[{"type":"bar","data":[15,20,10,25,8],"barWidth":"40%","animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

Donut chart example:
<div id="chart-2" class="echarts-chart" data-option='{"color":["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"],"backgroundColor":"transparent","tooltip":{"trigger":"item"},"legend":{"bottom":10,"textStyle":{"color":"#9fb0d7"}},"series":[{"type":"pie","radius":["40%","70%"],"center":["50%","45%"],"data":[{"value":30,"name":"${pieCategories[0]}"},{"value":25,"name":"${pieCategories[1]}"},{"value":20,"name":"${pieCategories[2]}"},{"value":25,"name":"${pieCategories[3]}"}],"label":{"color":"#e9efff"},"animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

Line chart example:
<div id="chart-3" class="echarts-chart" data-option='{"color":["#36f5ff","#5effc7","#b47bff"],"backgroundColor":"transparent","tooltip":{"trigger":"axis"},"grid":{"top":40,"bottom":30,"left":60,"right":20},"xAxis":{"type":"category","data":${JSON.stringify(weekLabels)},"axisLine":{"lineStyle":{"color":"#9fb0d7"}},"axisLabel":{"color":"#9fb0d7"}},"yAxis":{"splitLine":{"lineStyle":{"color":"rgba(255,255,255,0.06)"}},"axisLabel":{"color":"#9fb0d7"}},"series":[{"type":"line","smooth":true,"areaStyle":{"opacity":0.15},"data":[50,120,200,350,500,800],"animationDuration":1200,"animationEasing":"cubicInOut"}]}'></div>

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
  extraConstraint?: string
): Promise<{ text: string; finishReason: string }> {
  const { text, finishReason } = await generate("medium", prompt, {
    maxOutputTokens: 10000,
    system: [buildBaseSystemPrompt(language), extraConstraint].filter(Boolean).join("\n\n"),
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

  const { prompt, language } = body as { prompt?: string; language?: string };

  if (typeof prompt !== "string" || prompt.trim() === "") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const outputLanguage =
    typeof language === "string" && language.trim() ? language.trim() : "English";
  const trimmedPrompt = prompt.trim();
  const basePrompt = `Create a Marp Markdown slide deck in ${outputLanguage} based on the following event description:\n\n${trimmedPrompt}`;

  let markdown: string;
  let slideCount: number;

  try {
    const { text, finishReason } = await generateMarpMarkdown(basePrompt, outputLanguage);

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
    slideCount = countMarpSlides(markdown);

    if (slideCount < 6) {
      const retry = await generateMarpMarkdown(
        basePrompt,
        outputLanguage,
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
