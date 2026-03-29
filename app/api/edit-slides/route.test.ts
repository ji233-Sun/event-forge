import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => {
  mockGenerate.mockReset();
  mockGetSession.mockReset();
  mockHeaders.mockReset();
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

  it("edits a single slide and preserves the rest of the deck", async () => {
    mockGenerate.mockResolvedValue({
      text: "# Updated Title\n\nUpdated content",
      finishReason: "stop",
    });

    const markdown = [
      "# Title Slide",
      "",
      "---",
      "",
      "## Agenda",
    ].join("\n");

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
      markdown?: string;
    };

    expect(response.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate.mock.calls[0]?.[1]).toContain("# Title Slide");
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
