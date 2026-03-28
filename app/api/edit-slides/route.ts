import Marp from "@marp-team/marp-core";
import { generate } from "@/lib/ai";
import { parseSlides, joinSlides } from "@/lib/slides";

/**
 * Condensed style constraints injected when editing a single slide.
 * Keeps visual consistency (colors, overflow, ECharts) without the
 * full generation prompt.
 */
const SINGLE_SLIDE_SYSTEM = `你是一位 Marp 幻灯片编辑器。

CSS 变量（不要改变主题样式）：
--bg-0:#070b1f; --bg-1:#101a3c; --cyan:#36f5ff; --mint:#5effc7; --violet:#b47bff; --text:#e9efff; --muted:#9fb0d7;

加粗规范：HTML 块内用 <strong>，纯 Markdown 用 **...**。

防溢出（画布 1280×720）：每页总行数（含标题）≤12行；列表≤4项，每项≤18字；双栏每列≤6行；KPI≤3个。

ECharts：保持 data-option 为合法 JSON，backgroundColor 为 "transparent"，颜色数组用 ["#36f5ff","#5effc7","#b47bff","#ff6b9d","#ffd93d"]，animationDuration:1200。

不要修改 Marp front-matter（开头的 --- YAML 块）。
仅修改被要求的内容，保持整体 Marp Markdown 格式。
输出纯 Markdown，不要用代码块包裹，不要任何说明文字。`;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { markdown, instruction, scope, currentSlideIndex } = body as {
    markdown?: string;
    instruction?: string;
    scope?: "current" | "all";
    currentSlideIndex?: number;
  };

  if (!markdown || typeof markdown !== "string") {
    return Response.json({ error: "markdown is required" }, { status: 400 });
  }
  if (!instruction || typeof instruction !== "string") {
    return Response.json({ error: "instruction is required" }, { status: 400 });
  }
  if (scope !== "current" && scope !== "all") {
    return Response.json(
      { error: "scope must be 'current' or 'all'" },
      { status: 400 }
    );
  }

  let updatedMarkdown: string;

  if (scope === "current") {
    if (typeof currentSlideIndex !== "number" || !Number.isInteger(currentSlideIndex)) {
      return Response.json(
        { error: "currentSlideIndex is required when scope is 'current'" },
        { status: 400 }
      );
    }

    const idx = currentSlideIndex;
    const segments = parseSlides(markdown);

    if (idx < 0 || idx >= segments.length) {
      return Response.json(
        { error: `currentSlideIndex ${idx} out of range (${segments.length} slides)` },
        { status: 400 }
      );
    }

    // For slide 0: strip front-matter before sending to AI, restore after
    let slideContent = segments[idx];
    let frontMatterPrefix = "";
    if (idx === 0) {
      const fmMatch = slideContent.match(
        /^(---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$))/
      );
      if (fmMatch) {
        frontMatterPrefix = fmMatch[1];
        slideContent = slideContent.slice(frontMatterPrefix.length).trim();
      }
    }

    let text: string;
    let finishReason: string | undefined;
    try {
      ({ text, finishReason } = await generate(
        "medium",
        `按照以下指令修改这一页幻灯片，只返回修改后的幻灯片 Markdown，不要任何说明：\n\n当前幻灯片内容：\n\n${slideContent}\n\n修改指令：${instruction}`,
        { system: SINGLE_SLIDE_SYSTEM }
      ));
    } catch (error) {
      console.error("[edit-slides] single-slide generation failed:", error);
      return Response.json(
        { error: "AI generation failed. Try again." },
        { status: 502 }
      );
    }

    if (String(finishReason) === "length") {
      return Response.json(
        { error: "Model output truncated. Try a simpler instruction." },
        { status: 502 }
      );
    }

    const fenced = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
    const cleanText = fenced ? fenced[1].trim() : text.trim();
    const modifiedSlide = frontMatterPrefix + cleanText;
    segments[idx] = modifiedSlide;
    updatedMarkdown = joinSlides(segments);
  } else {
    // scope = 'all': re-generate the entire deck with the instruction applied
    let text: string;
    let finishReason: string | undefined;
    try {
      ({ text, finishReason } = await generate(
        "medium",
        `以下是当前演示文稿的 Marp Markdown，请按照修改指令对整个演示文稿进行修改，返回完整的 Marp Markdown：\n\n${markdown}\n\n修改指令：${instruction}`,
        { maxOutputTokens: 10000, system: SINGLE_SLIDE_SYSTEM }
      ));
    } catch (error) {
      console.error("[edit-slides] full-deck generation failed:", error);
      return Response.json(
        { error: "AI generation failed. Try again." },
        { status: 502 }
      );
    }

    if (String(finishReason) === "length") {
      return Response.json(
        { error: "Model output truncated. Try a shorter or simpler instruction." },
        { status: 502 }
      );
    }

    // Extract markdown from possible code fences
    const fenced = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
    updatedMarkdown = fenced ? fenced[1].trim() : text.trim();
  }

  if (!updatedMarkdown) {
    return Response.json(
      { error: "Failed to get updated markdown from model." },
      { status: 502 }
    );
  }

  let html: string;
  let css: string;
  try {
    const marp = new Marp({ html: true });
    ({ html, css } = marp.render(updatedMarkdown));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json(
      { error: `Marp render error: ${msg}` },
      { status: 502 }
    );
  }

  return Response.json({ html, css, markdown: updatedMarkdown });
}
