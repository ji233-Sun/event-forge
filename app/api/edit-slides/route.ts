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

const FULL_DECK_SYSTEM = `You are a Markdown presentation rewriter for full-deck updates.

You must apply the user's instruction across the entire deck, not just one slide.

Required:
- Output pure Markdown only. No explanation text and no outer code-fence wrapper.
- Do NOT use raw HTML tags. Use standard Markdown syntax.
- Keep \'---\' as slide separators.
- Keep ECharts blocks as fenced \`echarts\` JSON code blocks when charts are present.

Deck-wide quality rules:
- Rebalance sparse slides by adding concrete details, examples, and clearer supporting context.
- Improve layout variety across adjacent slides (e.g., agenda, bullets, comparison table, timeline-style list, KPI bullets).
- Avoid making neighboring slides look structurally identical.
- Keep each slide readable for a 1280x720 canvas:
  - Max 12 visible lines per slide.
  - Lists: max 4 items, each item concise but informative.

When the user asks to expand or relayout, you may rewrite headings and section structure across all slides while preserving deck coherence.
Output the complete updated Markdown deck.`;

function normalizeModelMarkdownOutput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  // Prefer explicit markdown code fences when the model wraps the whole response.
  const explicitMarkdownFence = trimmed.match(/^```(?:markdown|md)\s*\n?([\s\S]*?)\n?```$/i);
  if (explicitMarkdownFence) {
    return explicitMarkdownFence[1].trim();
  }

  // Some providers prepend prose and then add an explicit markdown block.
  const embeddedMarkdownFence = trimmed.match(/```(?:markdown|md)\s*\n?([\s\S]*?)\n?```/i);
  if (embeddedMarkdownFence) {
    return embeddedMarkdownFence[1].trim();
  }

  // Only unwrap unlabeled outer fences when the content itself looks like a slide deck.
  // This avoids corrupting legitimate ```echarts fences into plain text.
  const unlabeledOuterFence = trimmed.match(/^```\s*\n([\s\S]*?)\n```$/);
  if (unlabeledOuterFence) {
    const inner = unlabeledOuterFence[1].trim();
    const looksLikeSlideDeck = /^#{1,6}\s/m.test(inner) || /\r?\n---\r?\n/.test(inner) || /^[-*]\s/m.test(inner);
    if (looksLikeSlideDeck) {
      return inner;
    }
  }

  return trimmed;
}

function instructionRequestsSlideCountChange(instruction: string): boolean {
  return /(add|remove|delete|merge|split|increase|decrease).{0,30}(slide|slides)|slide\s*count|more\s*slides|fewer\s*slides|增加.{0,20}页|减少.{0,20}页|合并.{0,20}页|拆分.{0,20}页/u.test(
    instruction.toLowerCase(),
  );
}

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
  const originalSlideCount = parseSlides(markdown).length;
  const allowSlideCountChange = instructionRequestsSlideCountChange(instruction);

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

    const normalizedSlide = normalizeModelMarkdownOutput(text);
    const normalizedSegments = parseSlides(normalizedSlide);
    segments[idx] = normalizedSegments[0] ?? normalizedSlide;
    updatedMarkdown = joinSlides(segments);
  } else {
    let text: string;
    let finishReason: string | undefined;
    try {
      ({ text, finishReason } = await generate(
        "medium",
        `Here is the current Markdown slide deck (${originalSlideCount} slides). Apply the modification instruction to the entire deck and return the complete updated Markdown. ${allowSlideCountChange ? "You may change slide count only if needed to satisfy the instruction." : `Keep exactly ${originalSlideCount} slides.`}\n\n${markdown}\n\nModification instruction: ${instruction}`,
        { maxOutputTokens: 12000, system: FULL_DECK_SYSTEM },
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

    updatedMarkdown = normalizeModelMarkdownOutput(text);

    if (!allowSlideCountChange) {
      const editedSlideCount = parseSlides(updatedMarkdown).length;
      if (editedSlideCount !== originalSlideCount) {
        return Response.json(
          {
            error: `Edited deck must keep ${originalSlideCount} slides, but got ${editedSlideCount}. Please retry with a clearer instruction.`,
          },
          { status: 502 },
        );
      }
    }
  }

  if (!updatedMarkdown) {
    return Response.json(
      { error: "Failed to get updated markdown from model." },
      { status: 502 },
    );
  }

  return Response.json({ markdown: updatedMarkdown });
}
