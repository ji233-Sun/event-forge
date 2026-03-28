import { describe, expect, it } from "vitest";
import { replaceMarkdownStyle } from "./css-builder";

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

  it("returns markdown unchanged when no style block is present", () => {
    const noStyle = "---\nmarp: true\n---\n\n# Title";
    const result = replaceMarkdownStyle(noStyle, "body {}");
    expect(result).toBe(noStyle);
  });

  it("indents the replacement CSS with two spaces per line", () => {
    const result = replaceMarkdownStyle(SAMPLE_MARKDOWN, "h1 {\n  color: red;\n}");
    expect(result).toContain("  h1 {");
    expect(result).toContain("    color: red;");
  });
});
