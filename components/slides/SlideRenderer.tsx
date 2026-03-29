"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
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
  const modeKey = values.themeMode;
  const radius = values.borderRadius;

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

  // Map primary colors
  const primaryMap: Record<string, { primary: string; secondary: string; accent: string }> = {
    cyan: { primary: "#06b6d4", secondary: "#0891b2", accent: "#67e8f9" },
    violet: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#c4b5fd" },
    emerald: { primary: "#10b981", secondary: "#059669", accent: "#6ee7b7" },
    rose: { primary: "#f43f5e", secondary: "#e11d48", accent: "#fda4af" },
    amber: { primary: "#f59e0b", secondary: "#d97706", accent: "#fcd34d" },
    blue: { primary: "#3b82f6", secondary: "#2563eb", accent: "#93c5fd" },
  };

  // Map base colors
  const baseMap: Record<string, { light: { bg: string; text: string; muted: string; cardBg: string; cardBorder: string }; dark: { bg: string; text: string; muted: string; cardBg: string; cardBorder: string } }> = {
    slate: {
      light: { bg: "#f8fafc", text: "#0f172a", muted: "#475569", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(71,85,105,0.22)" },
      dark: { bg: "#0f172a", text: "#e2e8f0", muted: "#94a3b8", cardBg: "rgba(15,23,42,0.55)", cardBorder: "rgba(148,163,184,0.25)" },
    },
    zinc: {
      light: { bg: "#fafafa", text: "#18181b", muted: "#52525b", cardBg: "rgba(255,255,255,0.76)", cardBorder: "rgba(82,82,91,0.24)" },
      dark: { bg: "#18181b", text: "#f4f4f5", muted: "#a1a1aa", cardBg: "rgba(24,24,27,0.6)", cardBorder: "rgba(161,161,170,0.24)" },
    },
    neutral: {
      light: { bg: "#fafafa", text: "#171717", muted: "#525252", cardBg: "rgba(255,255,255,0.78)", cardBorder: "rgba(82,82,82,0.24)" },
      dark: { bg: "#171717", text: "#f5f5f5", muted: "#a3a3a3", cardBg: "rgba(23,23,23,0.62)", cardBorder: "rgba(163,163,163,0.24)" },
    },
  };

  const base = baseMap[values.baseColor]?.[modeKey] ?? baseMap.slate.dark;
  const accents = primaryMap[values.primaryColor] ?? primaryMap.cyan;
  const headingFont = headingFontMap[values.headingFont] ?? headingFontMap["Space Grotesk"];
  const bodyFont = bodyFontMap[values.bodyFont] ?? bodyFontMap["Open Sans"];

  return {
    "--color-bg": base.bg,
    "--color-text": base.text,
    "--color-muted": base.muted,
    "--color-primary": accents.primary,
    "--color-secondary": accents.secondary,
    "--color-accent": accents.accent,
    "--card-bg": base.cardBg,
    "--card-border": base.cardBorder,
    "--radius": radius,
    "--font-heading": headingFont,
    "--font-body": bodyFont,
  } as React.CSSProperties;
}

/* ── Background CSS generator ─────────────────────────────────────────── */

function getBackgroundStyle(values: TemplateValues): React.CSSProperties {
  const modeKey = values.themeMode;
  const primaryMap: Record<string, { primary: string; secondary: string; accent: string }> = {
    cyan: { primary: "#06b6d4", secondary: "#0891b2", accent: "#67e8f9" },
    violet: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#c4b5fd" },
    emerald: { primary: "#10b981", secondary: "#059669", accent: "#6ee7b7" },
    rose: { primary: "#f43f5e", secondary: "#e11d48", accent: "#fda4af" },
    amber: { primary: "#f59e0b", secondary: "#d97706", accent: "#fcd34d" },
    blue: { primary: "#3b82f6", secondary: "#2563eb", accent: "#93c5fd" },
  };
  const baseMap: Record<string, { light: { bg: string }; dark: { bg: string } }> = {
    slate: { light: { bg: "#f8fafc" }, dark: { bg: "#0f172a" } },
    zinc: { light: { bg: "#fafafa" }, dark: { bg: "#18181b" } },
    neutral: { light: { bg: "#fafafa" }, dark: { bg: "#171717" } },
  };

  const bg = baseMap[values.baseColor]?.[modeKey]?.bg ?? "#0f172a";
  const accents = primaryMap[values.primaryColor] ?? primaryMap.cyan;

  switch (values.bgStyle) {
    case "solid":
      return { background: bg };
    case "linear-gradient":
      return { background: `linear-gradient(145deg, ${bg} 0%, ${accents.secondary}66 100%)` };
    case "radial-gradient":
      return {
        background: `
          radial-gradient(1100px 460px at 12% -8%, ${accents.primary}33, transparent 58%),
          radial-gradient(980px 440px at 100% 0%, ${accents.secondary}2a, transparent 56%),
          linear-gradient(140deg, ${bg} 0%, ${accents.secondary}88 100%)`,
      };
    case "mesh":
      return {
        background: `
          radial-gradient(at 20% 20%, ${accents.primary}2b 0px, transparent 50%),
          radial-gradient(at 80% 10%, ${accents.secondary}2f 0px, transparent 50%),
          radial-gradient(at 70% 75%, ${accents.accent}2d 0px, transparent 50%),
          ${bg}`,
      };
    case "dots":
      return {
        background: `
          radial-gradient(var(--color-muted)22 1px, transparent 1px),
          linear-gradient(140deg, ${bg} 0%, ${accents.secondary}66 100%)`,
        backgroundSize: "14px 14px, 100% 100%",
      };
    default:
      return { background: bg };
  }
}

/* ── Card style classes ───────────────────────────────────────────────── */

function getCardClasses(cardStyle: string): string {
  switch (cardStyle) {
    case "flat":
      return "bg-[var(--card-bg)] border border-[var(--card-border)]";
    case "glassmorphism":
      return "bg-[var(--card-bg)] border border-[var(--color-primary)]/25 shadow-lg backdrop-blur-xl";
    case "neumorphism":
      return "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[10px_10px_20px_rgba(15,23,42,0.22),-8px_-8px_18px_rgba(255,255,255,0.05)]";
    case "brutalism":
      return "bg-[var(--card-bg)] border-[3px] border-[var(--color-primary)] shadow-[8px_8px_0_var(--color-secondary)]";
    default:
      return "bg-[var(--card-bg)] border border-[var(--card-border)]";
  }
}

/* ── Markdown components override ─────────────────────────────────────── */

function createMarkdownComponents(
  templateValues: TemplateValues,
): Components {
  const cardClass = getCardClasses(templateValues.cardStyle);
  const radius = templateValues.borderRadius;

  return {
    h1: ({ children }) => (
      <h1 className="mb-3 font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight text-[var(--color-primary)]">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-[var(--color-secondary)]">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-accent)]">
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
      <strong className="font-bold text-[var(--color-primary)]">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-3 border-[var(--color-primary)] pl-4 text-[var(--color-muted)] italic">
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
