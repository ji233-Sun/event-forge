import { afterEach, describe, expect, it, vi } from "vitest";

const { mockGenerate, mockRender, mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockRender: vi.fn(() => ({
    html: "<section>Rendered</section>",
    css: "section { color: red; }",
  })),
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  generate: mockGenerate,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@marp-team/marp-core", () => ({
  default: class MockMarp {
    render = mockRender;
  },
}));

import { POST } from "./route";

afterEach(() => {
  mockGenerate.mockReset();
  mockRender.mockReset();
  mockGetSession.mockReset();
  mockHeaders.mockReset();
  mockRender.mockImplementation(() => ({
    html: "<section>Rendered</section>",
    css: "section { color: red; }",
  }));
  mockGetSession.mockResolvedValue({ user: { id: "user_123" } });
  mockHeaders.mockResolvedValue(new Headers());
});

describe("POST /api/edit-slides", () => {
  it("returns 401 before parsing the body when the user is unauthenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

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

  it("returns 400 when the parsed JSON body is not a plain object", async () => {
    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
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

  it("rejects a non-integer currentSlideIndex", async () => {
    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "# Slide 1",
        instruction: "Update the title",
        scope: "current",
        currentSlideIndex: 1.5,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "currentSlideIndex is required when scope is 'current'",
    });
  });

  it("returns 502 when single-slide AI editing throws", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("provider down"));

    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "# Slide 1",
        instruction: "Update the title",
        scope: "current",
        currentSlideIndex: 0,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI generation failed. Try again.",
    });
  });

  it("returns 502 when full-deck AI editing throws", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("provider down"));

    const request = new Request("http://localhost/api/edit-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: "# Slide 1",
        instruction: "Update the deck",
        scope: "all",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI generation failed. Try again.",
    });
  });
});
