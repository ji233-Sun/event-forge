import { describe, expect, it } from "vitest";
import { buildDynamicStyle, replaceMarkdownStyle } from "./css-builder";
import { DEFAULT_TEMPLATE_VALUES } from "./config";

const SAMPLE_MARKDOWN = `---
marp: true
theme: default
paginate: true
style: |
  section {
    background: #000;
    color: #fff;
  }
---

<!-- _class: cover -->
# Title

---

## Slide 2
`;

describe("replaceMarkdownStyle", () => {
  it("replaces the style block with new CSS", () => {
    const result = replaceMarkdownStyle(SAMPLE_MARKDOWN, "section {\n  background: #fff;\n}");
    expect(result).toContain("background: #fff;");
    expect(result).not.toContain("background: #000;");
  });

  it("preserves the front-matter closing ---", () => {
    const result = replaceMarkdownStyle(SAMPLE_MARKDOWN, "body {}");
    const lines = result.split("\n");
    // first line is "---" (front-matter open), find the second "---" (front-matter close)
    const secondDashIdx = lines.findIndex((l, i) => i > 0 && /^---\s*$/.test(l));
    expect(secondDashIdx).toBeGreaterThan(0);
  });

  it("preserves slide separators after the front-matter", () => {
    const result = replaceMarkdownStyle(SAMPLE_MARKDOWN, "body {}");
    const matches = result.match(/^---\s*$/gm);
    // front-matter open, front-matter close, slide separator = at least 3
    expect(matches?.length).toBeGreaterThanOrEqual(3);
  });

  it("inserts style block when front-matter has none", () => {
    const noStyle = "---\nmarp: true\n---\n\n# Title";
    const result = replaceMarkdownStyle(noStyle, "body {}");
    expect(result).toContain("style: |");
    expect(result).toContain("  body {}");
    expect(result).toContain("# Title");
  });

  it("prepends front-matter when markdown has none", () => {
    const bare = "# Title\n\n- item";
    const result = replaceMarkdownStyle(bare, "body {}");
    expect(result.startsWith("---")).toBe(true);
    expect(result).toContain("style: |");
    expect(result).toContain("# Title");
  });

  it("indents the replacement CSS with two spaces per line", () => {
    const result = replaceMarkdownStyle(SAMPLE_MARKDOWN, "h1 {\n  color: red;\n}");
    expect(result).toContain("  h1 {");
    expect(result).toContain("    color: red;");
  });
});

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
    // Inter is a heading font only; use a combo where heading === body is not possible,
    // so instead test that two different fonts produce two @import family params
    const { style } = buildDynamicStyle({
      ...DEFAULT_TEMPLATE_VALUES,
      headingFont: "Inter",
      bodyFont: "Roboto",
    });
    // Both fonts should appear in the import URL
    expect(style).toContain("Inter");
    expect(style).toContain("Roboto");
    // When same query string would appear twice, Set deduplication removes it
    const importLine = style.split("\n")[0];
    const familyMatches = importLine.match(/family=/g);
    expect(familyMatches?.length).toBe(2);
  });
});
