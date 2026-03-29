import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerate, mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
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

import { POST } from "./route";

beforeEach(() => {
  mockGetSession.mockResolvedValue({ user: { id: "user_123" } });
  mockHeaders.mockResolvedValue(new Headers());
});

afterEach(() => {
  mockGenerate.mockReset();
  mockGetSession.mockReset();
  mockHeaders.mockReset();
});

describe("POST /api/generate-slides", () => {
  it("returns 400 when the request body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/generate-slides", {
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

  it("returns 400 when the parsed JSON body is not an object", async () => {
    const request = new Request("http://localhost/api/generate-slides", {
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

  it("rejects a whitespace-only prompt", async () => {
    const request = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "   " }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "prompt is required",
    });
  });

  it("retries when the deck has fewer slides than requested and passes the requested language to the model", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        text: "```\n# One\n```",
        finishReason: "stop",
      })
      .mockResolvedValueOnce({
        text: "```\n# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n```",
        finishReason: "stop",
      });

    const request = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Create a sponsor deck for a student festival",
        language: "Spanish",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      markdown?: string;
    };

    expect(response.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(mockGenerate.mock.calls[0]?.[1]).toContain(
      "Create a Markdown slide deck in Spanish"
    );
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain(
      "Generate exactly 8 slides"
    );
    expect(mockGenerate.mock.calls[0]?.[2]?.system).not.toContain("中文");
    expect(mockGenerate.mock.calls[1]?.[2]?.system).not.toContain("中文");
    expect(mockGenerate.mock.calls[1]?.[2]?.system).toContain(
      "Hard requirement: output at least 8 slides."
    );
    expect(payload.markdown).toContain("# Four");
  });

  it("returns 502 when AI generation throws", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("provider down"));

    const request = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Create a deck" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI generation failed. Try again.",
    });
  });

  it("uses DEFAULT_TEMPLATE_VALUES when templateValues is absent", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: "# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six\n\n---\n\n# Seven\n\n---\n\n# Eight",
      finishReason: "stop",
    });

    const req = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a campus festival" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // The system prompt should contain hex color codes from the palette
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain("#06b6d4");
  });

  it("injects templateValues colors into the system prompt", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: "# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six\n\n---\n\n# Seven\n\n---\n\n# Eight",
      finishReason: "stop",
    });

    const req = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "a campus festival",
        templateValues: {
          themeMode: "light",
          baseColor: "neutral",
          primaryColor: "rose",
          bgStyle: "solid",
          headingFont: "Inter",
          bodyFont: "Roboto",
          cardStyle: "flat",
          borderRadius: "8px",
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // rose primary = #f43f5e
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain("#f43f5e");
  });

  it("respects custom slideCount from request body", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: Array.from({ length: 6 }, (_, i) => `# Slide ${i + 1}`).join("\n\n---\n\n"),
      finishReason: "stop",
    });

    const req = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a campus festival", slideCount: 6 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // System prompt should request exactly 6 slides
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain("Generate exactly 6 slides");
  });

  it("clamps slideCount to [4, 16]", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: Array.from({ length: 4 }, (_, i) => `# Slide ${i + 1}`).join("\n\n---\n\n"),
      finishReason: "stop",
    });

    const req = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a campus festival", slideCount: 2 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // Clamped to minimum 4
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain("Generate exactly 4 slides");
  });

  it("defaults to detailed depth mode when detailLevel is omitted", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: Array.from({ length: 8 }, (_, i) => `# Slide ${i + 1}`).join("\n\n---\n\n"),
      finishReason: "stop",
    });

    const req = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a campus festival" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain("Depth mode: Detailed");
  });

  it("applies concise depth mode when requested", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: Array.from({ length: 8 }, (_, i) => `# Slide ${i + 1}`).join("\n\n---\n\n"),
      finishReason: "stop",
    });

    const req = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "a campus festival", detailLevel: "concise" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain("Depth mode: Concise");
  });
});
