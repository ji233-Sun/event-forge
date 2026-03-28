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
  mockGenerate.mockReset();
  mockRender.mockReset();
  mockRender.mockImplementation(() => ({
    html: "<section>Rendered</section>",
    css: "section { color: red; }",
  }));
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

  it("retries until the deck has at least 6 slides and passes the requested language to the model", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        text: "```\n---\nmarp: true\n---\n\n# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n```",
        finishReason: "stop",
      })
      .mockResolvedValueOnce({
        text: "```\n---\nmarp: true\n---\n\n# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six\n```",
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
      html?: string;
      css?: string;
    };

    expect(response.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(mockGenerate.mock.calls[0]?.[1]).toContain(
      "Create a Marp Markdown slide deck in Spanish"
    );
    expect(mockGenerate.mock.calls[0]?.[2]?.system).toContain(
      "Content language: Spanish"
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

  it("returns 502 when Marp rendering throws", async () => {
    mockGenerate.mockResolvedValueOnce({
      text: "```\n---\nmarp: true\n---\n\n# One\n\n---\n\n# Two\n\n---\n\n# Three\n\n---\n\n# Four\n\n---\n\n# Five\n\n---\n\n# Six\n```",
      finishReason: "stop",
    });
    mockRender.mockImplementationOnce(() => {
      throw new Error("render failed");
    });

    const request = new Request("http://localhost/api/generate-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Create a deck" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to render generated slides. Try again.",
    });
  });
});
