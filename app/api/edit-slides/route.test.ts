import { afterEach, describe, expect, it, vi } from "vitest";

const { mockGenerate, mockRender } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockRender: vi.fn(() => ({
    html: "<section>Rendered</section>",
    css: "section { color: red; }",
  })),
}));

vi.mock("@/lib/ai", () => ({
  generate: mockGenerate,
}));

vi.mock("@marp-team/marp-core", () => ({
  default: class MockMarp {
    render = mockRender;
  },
}));

import { POST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/edit-slides", () => {
  it("returns 400 when the request body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
    });
  });

  it("preserves CRLF front-matter when editing the first slide", async () => {
    mockGenerate.mockResolvedValue({
      text: "# Updated Title\r\n\r\nUpdated content",
      finishReason: "stop",
    });

    const markdown = [
      "---",
      "marp: true",
      "theme: default",
      "---",
      "",
      "# Title Slide",
      "",
      "---",
      "",
      "## Agenda",
    ].join("\r\n");

    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown,
        instruction: "Update the opener",
        scope: "current",
        currentSlideIndex: 0,
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      html?: string;
      css?: string;
      markdown?: string;
    };

    expect(response.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate.mock.calls[0]?.[1]).toContain("# Title Slide");
    expect(mockGenerate.mock.calls[0]?.[1]).not.toContain("marp: true");
    expect(payload.markdown).toMatch(/^---\r\nmarp: true\r\ntheme: default\r\n---/);
    expect(payload.markdown).toContain("# Updated Title");
    expect(payload.markdown).toContain("## Agenda");
  });
});
