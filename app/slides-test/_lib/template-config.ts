export const TEMPLATE_OPTIONS = {
  themeMode: ["light", "dark"],
  baseColor: ["slate", "zinc", "neutral"],
  primaryColor: ["cyan", "violet", "emerald", "rose", "amber", "blue"],
  bgStyle: ["solid", "linear-gradient", "radial-gradient", "mesh", "dots"],
  headingFont: ["Inter", "Playfair Display", "Montserrat", "Space Grotesk"],
  bodyFont: ["Roboto", "Open Sans", "Nunito"],
  cardStyle: ["flat", "glassmorphism", "neumorphism", "brutalism"],
  borderRadius: ["0px", "4px", "8px", "16px", "32px"],
} as const;

export type ThemeMode = (typeof TEMPLATE_OPTIONS.themeMode)[number];
export type BaseColor = (typeof TEMPLATE_OPTIONS.baseColor)[number];
export type PrimaryColor = (typeof TEMPLATE_OPTIONS.primaryColor)[number];
export type BgStyle = (typeof TEMPLATE_OPTIONS.bgStyle)[number];
export type HeadingFont = (typeof TEMPLATE_OPTIONS.headingFont)[number];
export type BodyFont = (typeof TEMPLATE_OPTIONS.bodyFont)[number];
export type CardStyle = (typeof TEMPLATE_OPTIONS.cardStyle)[number];
export type BorderRadius = (typeof TEMPLATE_OPTIONS.borderRadius)[number];

export type TemplateValues = {
  themeMode: ThemeMode;
  baseColor: BaseColor;
  primaryColor: PrimaryColor;
  bgStyle: BgStyle;
  headingFont: HeadingFont;
  bodyFont: BodyFont;
  cardStyle: CardStyle;
  borderRadius: BorderRadius;
};

export type TemplateKey = keyof TemplateValues;

export const TEMPLATE_KEYS = [
  "themeMode",
  "baseColor",
  "primaryColor",
  "bgStyle",
  "headingFont",
  "bodyFont",
  "cardStyle",
  "borderRadius",
] as const satisfies readonly TemplateKey[];

export const DEFAULT_TEMPLATE_VALUES: TemplateValues = {
  themeMode: "dark",
  baseColor: "slate",
  primaryColor: "cyan",
  bgStyle: "radial-gradient",
  headingFont: "Space Grotesk",
  bodyFont: "Open Sans",
  cardStyle: "glassmorphism",
  borderRadius: "16px",
};

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  themeMode: "Theme Mode",
  baseColor: "Base Color",
  primaryColor: "Primary Color",
  bgStyle: "Background Style",
  headingFont: "Heading Font",
  bodyFont: "Body Font",
  cardStyle: "Card Style",
  borderRadius: "Border Radius",
};
