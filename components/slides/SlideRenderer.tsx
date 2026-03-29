"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { resolveBackgroundStyle, resolvePalette } from "@/lib/slides/template/css-builder";
import type { TemplateValues } from "@/lib/slides/template/config";
import { ChartBlock } from "./ChartBlock";

interface SlideRendererProps {
  /** Markdown content for a single slide */
  content: string;
  /** Current template values for theming */
  templateValues: TemplateValues;
  /** Extra class names for the wrapper */
  className?: string;
}

/* ── Map template values → CSS custom properties ──────────────────────── */

function templateToStyle(values: TemplateValues): React.CSSProperties {
  const radius = values.borderRadius;
  const palette = resolvePalette(values);

  // Map heading font
  const headingFontMap: Record<string, string> = {
    Inter: "'Inter', 'Segoe UI', sans-serif",
    "Playfair Display": "'Playfair Display', Georgia, serif",
    Montserrat: "'Montserrat', 'Segoe UI', sans-serif",
    "Space Grotesk": "'Space Grotesk', 'Segoe UI', sans-serif",
  };

  // Map body font
  const bodyFontMap: Record<string, string> = {
    Roboto: "'Roboto', 'Segoe UI', sans-serif",
    "Open Sans": "'Open Sans', 'Segoe UI', sans-serif",
    Nunito: "'Nunito', 'Segoe UI', sans-serif",
  };

  const headingFont = headingFontMap[values.headingFont] ?? headingFontMap["Space Grotesk"];
  const bodyFont = bodyFontMap[values.bodyFont] ?? bodyFontMap["Open Sans"];

  return {
    "--color-bg": palette.slideBg,
    "--color-text": palette.slideText,
    "--color-muted": palette.slideMuted,
    "--color-primary": palette.primary,
    "--color-secondary": palette.secondary,
    "--color-accent": palette.accent,
    "--card-bg": palette.cardBg,
    "--card-border": palette.cardBorder,
    "--radius": radius,
    "--font-heading": headingFont,
    "--font-body": bodyFont,
  } as React.CSSProperties;
}

/* ── Background CSS generator ─────────────────────────────────────────── */

function getBackgroundStyle(values: TemplateValues): React.CSSProperties {
  const palette = resolvePalette(values);
  const resolved = resolveBackgroundStyle(values, palette);
  return resolved.backgroundSize
    ? { background: resolved.background, backgroundSize: resolved.backgroundSize }
    : { background: resolved.background };
}

/* ── Markdown components override ─────────────────────────────────────── */

function createMarkdownComponents(
  templateValues: TemplateValues,
): Components {
  return {
    h1: ({ children }) => (
      <h1 className="mb-3 font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight text-[var(--color-primary)]">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-[var(--color-text)]">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-2 text-lg leading-relaxed text-[var(--color-text)]">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-2 list-disc space-y-1 pl-6 text-lg text-[var(--color-text)]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 list-decimal space-y-1 pl-6 text-lg text-[var(--color-text)]">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-[var(--color-text)]">{children}</li>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-[var(--color-text)]">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-3 border-[var(--color-primary)] pl-4 text-[var(--color-text)] italic">
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...rest }) => {
      const match = /language-(\w+)/.exec(className ?? "");
      const lang = match?.[1];

      // ECharts code block: render as ChartBlock
      if (lang === "echarts") {
        const raw = String(children).replace(/\n$/, "");
        return (
          <div className="my-3 h-[260px] rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-1">
            <ChartBlock raw={raw} templateValues={templateValues} />
          </div>
        );
      }

      // Inline code
      if (!className) {
        return (
          <code
            className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 font-mono text-sm text-[var(--color-accent)]"
            {...rest}
          >
            {children}
          </code>
        );
      }

      // Other code blocks
      return (
        <pre className="my-2 overflow-x-auto rounded-lg bg-[var(--card-bg)] p-3 text-sm">
          <code className={className}>{children}</code>
        </pre>
      );
    },
    hr: () => (
      <hr className="my-4 border-[var(--card-border)]" />
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-[var(--color-primary)] underline hover:text-[var(--color-accent)]"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-[var(--card-border)] px-3 py-2 font-semibold text-[var(--color-primary)]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[var(--card-border)] px-3 py-2 text-[var(--color-text)]">
        {children}
      </td>
    ),
  };
}

/* ── Main SlideRenderer ───────────────────────────────────────────────── */

export function SlideRenderer({ content, templateValues, className }: SlideRendererProps) {
  const cssVars = templateToStyle(templateValues);
  const bgStyle = getBackgroundStyle(templateValues);

  // Strip YAML front-matter from content (legacy Marp format)
  const cleanedContent = content
    .replace(/^---\s*\n[\s\S]*?\n---\s*(\n|$)/, "")
    .trim();

  const components = createMarkdownComponents(templateValues);
  const radius = templateValues.borderRadius;

  return (
    <div
      className={[
        "relative flex h-full w-full flex-col overflow-hidden p-12",
        className,
      ].join(" ")}
      style={{
        ...cssVars,
        ...bgStyle,
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        borderRadius: radius,
      }}
    >
      {/* Decorative inner border */}
      <div
        className="pointer-events-none absolute inset-3 rounded-[calc(var(--radius)+6px)] border border-[var(--card-border)]"
        aria-hidden
      />
      <div className="relative z-10 flex-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {cleanedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
