import type {
  BaseColor,
  BodyFont,
  CardStyle,
  HeadingFont,
  PrimaryColor,
  TemplateValues,
  ThemeMode,
} from "./config";

export type Palette = {
  slideBg: string;
  slideText: string;
  slideMuted: string;
  primary: string;
  secondary: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
};

const PRIMARY_TONES: Record<PrimaryColor, { primary: string; secondary: string; accent: string }> = {
  cyan: { primary: "#06b6d4", secondary: "#0891b2", accent: "#67e8f9" },
  violet: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#c4b5fd" },
  emerald: { primary: "#10b981", secondary: "#059669", accent: "#6ee7b7" },
  rose: { primary: "#f43f5e", secondary: "#e11d48", accent: "#fda4af" },
  amber: { primary: "#f59e0b", secondary: "#d97706", accent: "#fcd34d" },
  blue: { primary: "#3b82f6", secondary: "#2563eb", accent: "#93c5fd" },
};

const BASE_TONES: Record<
  BaseColor,
  {
    light: Pick<Palette, "slideBg" | "slideText" | "slideMuted" | "cardBg" | "cardBorder">;
    dark: Pick<Palette, "slideBg" | "slideText" | "slideMuted" | "cardBg" | "cardBorder">;
  }
> = {
  slate: {
    light: { slideBg: "#f8fafc", slideText: "#0f172a", slideMuted: "#475569", cardBg: "rgba(255,255,255,0.72)", cardBorder: "rgba(71,85,105,0.22)" },
    dark: { slideBg: "#0f172a", slideText: "#e2e8f0", slideMuted: "#94a3b8", cardBg: "rgba(15,23,42,0.55)", cardBorder: "rgba(148,163,184,0.25)" },
  },
  zinc: {
    light: { slideBg: "#fafafa", slideText: "#18181b", slideMuted: "#52525b", cardBg: "rgba(255,255,255,0.76)", cardBorder: "rgba(82,82,91,0.24)" },
    dark: { slideBg: "#18181b", slideText: "#f4f4f5", slideMuted: "#a1a1aa", cardBg: "rgba(24,24,27,0.6)", cardBorder: "rgba(161,161,170,0.24)" },
  },
  neutral: {
    light: { slideBg: "#fafafa", slideText: "#171717", slideMuted: "#525252", cardBg: "rgba(255,255,255,0.78)", cardBorder: "rgba(82,82,82,0.24)" },
    dark: { slideBg: "#171717", slideText: "#f5f5f5", slideMuted: "#a3a3a3", cardBg: "rgba(23,23,23,0.62)", cardBorder: "rgba(163,163,163,0.24)" },
  },
};

const FONT_QUERY: Record<HeadingFont | BodyFont, string> = {
  Inter: "Inter:wght@400;500;600;700",
  "Playfair Display": "Playfair+Display:wght@500;600;700",
  Montserrat: "Montserrat:wght@500;600;700",
  "Space Grotesk": "Space+Grotesk:wght@400;500;700",
  Roboto: "Roboto:wght@400;500;700",
  "Open Sans": "Open+Sans:wght@400;500;700",
  Nunito: "Nunito:wght@400;500;700",
};

const FONT_STACKS: {
  heading: Record<HeadingFont, string>;
  body: Record<BodyFont, string>;
} = {
  heading: {
    Inter: "'Inter', 'Segoe UI', sans-serif",
    "Playfair Display": "'Playfair Display', Georgia, serif",
    Montserrat: "'Montserrat', 'Segoe UI', sans-serif",
    "Space Grotesk": "'Space Grotesk', 'Segoe UI', sans-serif",
  },
  body: {
    Roboto: "'Roboto', 'Segoe UI', sans-serif",
    "Open Sans": "'Open Sans', 'Segoe UI', sans-serif",
    Nunito: "'Nunito', 'Segoe UI', sans-serif",
  },
};

export function resolvePalette(values: TemplateValues): Palette {
  const modeKey: ThemeMode = values.themeMode;
  const base = BASE_TONES[values.baseColor][modeKey];
  const accents = PRIMARY_TONES[values.primaryColor];
  return { ...base, ...accents };
}

function backgroundCss(values: TemplateValues, palette: Palette): string {
  switch (values.bgStyle) {
    case "solid":
      return `background: ${palette.slideBg};`;
    case "linear-gradient":
      return `background: linear-gradient(145deg, ${palette.slideBg} 0%, ${palette.secondary}66 100%);`;
    case "radial-gradient":
      return `background:
        radial-gradient(1100px 460px at 12% -8%, ${palette.primary}33, transparent 58%),
        radial-gradient(980px 440px at 100% 0%, ${palette.secondary}2a, transparent 56%),
        linear-gradient(140deg, ${palette.slideBg} 0%, ${palette.secondary}88 100%);`;
    case "mesh":
      return `background:
        radial-gradient(at 20% 20%, ${palette.primary}2b 0px, transparent 50%),
        radial-gradient(at 80% 10%, ${palette.secondary}2f 0px, transparent 50%),
        radial-gradient(at 70% 75%, ${palette.accent}2d 0px, transparent 50%),
        ${palette.slideBg};`;
    case "dots":
      return `background:
        radial-gradient(${palette.slideMuted}22 1px, transparent 1px),
        linear-gradient(140deg, ${palette.slideBg} 0%, ${palette.secondary}66 100%);
      background-size: 14px 14px, 100% 100%;`;
  }
}

function cardCss(cardStyle: CardStyle, palette: Palette): string {
  switch (cardStyle) {
    case "flat":
      return `\n.panel, .kpi {\n  background: ${palette.cardBg};\n  border: 1px solid ${palette.cardBorder};\n  box-shadow: none;\n}`;
    case "glassmorphism":
      return `\n.panel, .kpi {\n  background: ${palette.cardBg};\n  border: 1px solid ${palette.primary}40;\n  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.2);\n  backdrop-filter: blur(12px);\n}`;
    case "neumorphism":
      return `\n.panel, .kpi {\n  background: ${palette.cardBg};\n  border: 1px solid ${palette.cardBorder};\n  box-shadow: 10px 10px 20px rgba(15, 23, 42, 0.22), -8px -8px 18px rgba(255, 255, 255, 0.05);\n}`;
    case "brutalism":
      return `\n.panel, .kpi {\n  background: ${palette.cardBg};\n  border: 3px solid ${palette.primary};\n  box-shadow: 8px 8px 0 ${palette.secondary};\n}`;
  }
}

function buildFontImport(heading: TemplateValues["headingFont"], body: TemplateValues["bodyFont"]): string {
  const families = Array.from(new Set([FONT_QUERY[heading], FONT_QUERY[body]]));
  return `@import url('https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap');`;
}

export function buildDynamicStyle(values: TemplateValues): { style: string; palette: Palette } {
  const palette = resolvePalette(values);
  const headingFont = FONT_STACKS.heading[values.headingFont];
  const bodyFont = FONT_STACKS.body[values.bodyFont];
  const radius = values.borderRadius;
  const bg = backgroundCss(values, palette);
  const importRule = buildFontImport(values.headingFont, values.bodyFont);

  const style = `${importRule}

:root {
  --slide-bg: ${palette.slideBg};
  --slide-text: ${palette.slideText};
  --slide-muted: ${palette.slideMuted};
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary};
  --color-accent: ${palette.accent};
  --card-bg: ${palette.cardBg};
  --card-border: ${palette.cardBorder};
  --radius: ${radius};
}

section {
  ${bg}
  color: var(--slide-text, ${palette.slideText});
  font-family: ${bodyFont};
  padding: 50px;
  line-height: 1.42;
}

section::before {
  content: "";
  position: absolute;
  inset: 14px;
  border-radius: calc(var(--radius, ${radius}) + 6px);
  border: 1px solid var(--card-border, ${palette.cardBorder});
  pointer-events: none;
}

h1, h2, h3 { font-family: ${headingFont}; margin: 0 0 14px; letter-spacing: 0.4px; }
h1 { color: var(--color-primary, ${palette.primary}); font-size: 58px; }
h2 { color: var(--color-secondary, ${palette.secondary}); font-size: 38px; }
h3 { color: var(--color-accent, ${palette.accent}); font-size: 28px; }
p, li { font-size: 22px; }
strong { color: var(--color-primary, ${palette.primary}); }

.cover h1 { text-align: center; margin-top: 42px; }
.cover p { text-align: center; color: var(--color-accent, ${palette.accent}); font-size: 28px; }

.panel { margin-top: 12px; border-radius: var(--radius, ${radius}); padding: 14px 16px; }
.two-col { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; align-items: start; }
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 14px; }
.kpi { border-radius: var(--radius, ${radius}); padding: 14px; }
.kpi .label { color: var(--slide-muted, ${palette.slideMuted}); font-size: 15px; }
.kpi .value { color: var(--color-accent, ${palette.accent}); font-size: 34px; font-weight: 700; }
.timeline-item { border-left: 3px solid var(--color-primary, ${palette.primary}); padding-left: 12px; margin: 10px 0; }

.echarts-chart {
  width: 100%;
  height: 270px;
  border-radius: var(--radius);
  border: 1px solid ${palette.primary}55;
  background: ${values.themeMode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.56)"};
}

.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
.chart-row .echarts-chart { height: 230px; }
${cardCss(values.cardStyle, palette)}`;

  return { style, palette };
}

