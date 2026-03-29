import { describe, expect, it } from "vitest";
import { buildDynamicStyle } from "./css-builder";
import { DEFAULT_TEMPLATE_VALUES } from "./config";

describe("buildDynamicStyle", () => {
  it("returns style string containing CSS variables for given palette", () => {
    const { style, palette } = buildDynamicStyle(DEFAULT_TEMPLATE_VALUES);
    expect(style).toContain(`--color-primary: ${palette.primary}`);
    expect(style).toContain(`--slide-bg: ${palette.slideBg}`);
  });

  it("uses light background values when themeMode is light", () => {
    const { style } = buildDynamicStyle({ ...DEFAULT_TEMPLATE_VALUES, themeMode: "light" });
    // light slate slideBg is #f8fafc
    expect(style).toContain("#f8fafc");
  });

  it("deduplicates font imports when headingFont and bodyFont are the same family", () => {
    const { style } = buildDynamicStyle({
      ...DEFAULT_TEMPLATE_VALUES,
      headingFont: "Inter",
      bodyFont: "Roboto",
    });
    expect(style).toContain("Inter");
    expect(style).toContain("Roboto");
    const importLine = style.split("\n")[0];
    const familyMatches = importLine.match(/family=/g);
    expect(familyMatches?.length).toBe(2);
  });
});
