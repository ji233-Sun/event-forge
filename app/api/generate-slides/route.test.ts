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

  it("retries until the deck has at least 6 slides and passes the requested language to the model", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        text: "```\n# One\n```",
        finishReason: "stop",
      })
      .mockResolvedValueOnce({
        text: "```\n# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six\n```",
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
      "All slide copy must be written in Spanish"
    );
    expect(mockGenerate.mock.calls[0]?.[2]?.system).not.toContain("中文");
    expect(mockGenerate.mock.calls[1]?.[2]?.system).not.toContain("中文");
    expect(mockGenerate.mock.calls[1]?.[2]?.system).toContain(
      "Hard requirement: output at least 6 slides."
    );
    expect(payload.markdown).toContain("# Six");
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
      text: "# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six",
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
      text: "# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six",
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
});
