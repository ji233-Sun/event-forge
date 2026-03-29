import { generate } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { isPlainObject } from "@/lib/api-utils";
import { parseSlides, joinSlides } from "@/lib/slides";
import { headers } from "next/headers";

const SINGLE_SLIDE_SYSTEM = `You are a Markdown slide editor.

You edit individual slides in a Markdown-based presentation. Follow these rules:

- Output pure Markdown only. No explanation text, no code fences wrapping the output.
- Do NOT use raw HTML tags. Use standard Markdown syntax.
- Use **...** for emphasis.
- Do NOT include YAML front-matter blocks.

Overflow rules (1280×720 canvas):
- Max 12 total visible lines per slide (including headings).
- Lists: max 4 items, each item ≤ 12 words (or ≤ 18 Chinese characters).
- Two-column layouts: max 6 lines per column.
- Max 3 KPI metrics in one row.
- Split content across more slides instead of cramming.

ECharts:
- Embed charts as fenced code blocks with language \`echarts\` containing valid JSON.
- Always set "backgroundColor":"transparent".
- Keep data-option as valid JSON with double quotes.
- Use "animationDuration":1200 and "animationEasing":"cubicInOut".

Only modify what is requested. Preserve the overall Markdown format.
Output pure Markdown, do not wrap in code fences, and do not add any explanation.`;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
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
      { status: 400 },
    );
  }

  let updatedMarkdown: string;

  if (scope === "current") {
    if (typeof currentSlideIndex !== "number" || !Number.isInteger(currentSlideIndex)) {
      return Response.json(
        { error: "currentSlideIndex is required when scope is 'current'" },
        { status: 400 },
      );
    }

    const idx = currentSlideIndex;
    const segments = parseSlides(markdown);

    if (idx < 0 || idx >= segments.length) {
      return Response.json(
        { error: `currentSlideIndex ${idx} out of range (${segments.length} slides)` },
        { status: 400 },
      );
    }

    const slideContent = segments[idx];

    let text: string;
    let finishReason: string | undefined;
    try {
      ({ text, finishReason } = await generate(
        "medium",
        `Modify this slide according to the instruction below. Return only the modified slide Markdown:\n\nCurrent slide:\n\n${slideContent}\n\nInstruction: ${instruction}`,
        { system: SINGLE_SLIDE_SYSTEM },
      ));
    } catch (error) {
      console.error("[edit-slides] single-slide generation failed:", error);
      return Response.json(
        { error: "AI generation failed. Try again." },
        { status: 502 },
      );
    }

    if (String(finishReason) === "length") {
      return Response.json(
        { error: "Model output truncated. Try a simpler instruction." },
        { status: 502 },
      );
    }

    const fenced = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
    const cleanText = fenced ? fenced[1].trim() : text.trim();
    segments[idx] = cleanText;
    updatedMarkdown = joinSlides(segments);
  } else {
    let text: string;
    let finishReason: string | undefined;
    try {
      ({ text, finishReason } = await generate(
        "medium",
        `Here is the current Markdown slide deck. Apply the modification instruction to the entire deck, then return the complete updated Markdown:\n\n${markdown}\n\nModification instruction: ${instruction}`,
        { maxOutputTokens: 10000, system: SINGLE_SLIDE_SYSTEM },
      ));
    } catch (error) {
      console.error("[edit-slides] full-deck generation failed:", error);
      return Response.json(
        { error: "AI generation failed. Try again." },
        { status: 502 },
      );
    }

    if (String(finishReason) === "length") {
      return Response.json(
        { error: "Model output truncated. Try a shorter or simpler instruction." },
        { status: 502 },
      );
    }

    const fenced = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
    updatedMarkdown = fenced ? fenced[1].trim() : text.trim();
  }

  if (!updatedMarkdown) {
    return Response.json(
      { error: "Failed to get updated markdown from model." },
      { status: 502 },
    );
  }

  return Response.json({ markdown: updatedMarkdown });
}
