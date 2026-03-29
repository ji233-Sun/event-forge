import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
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

const authedSession = { user: { id: "user_123" } };

beforeEach(() => {
  mockGetSession.mockResolvedValue(authedSession);
  mockHeaders.mockResolvedValue(new Headers());
});

afterEach(() => {
  mockGetSession.mockReset();
  mockHeaders.mockReset();
});

const SAMPLE_MARKDOWN = `# Title

Some content

---

## Slide Two

More content`;

describe("POST /api/restyle-slides", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: SAMPLE_MARKDOWN }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when markdown is missing", async () => {
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: "markdown is required" });
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns markdown on success with default template", async () => {
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: SAMPLE_MARKDOWN }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { markdown: string };
    expect(data.markdown).toBeDefined();
  });

  it("replaces ECharts hex colors when palette changes", async () => {
    const chartMarkdown = [
      "# Budget",
      "",
      "```echarts",
      JSON.stringify({
        color: ["#06b6d4", "#0891b2"],
        backgroundColor: "transparent",
      }),
      "```",
    ].join("\n");

    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: chartMarkdown,
        prevTemplateValues: {
          themeMode: "dark",
          baseColor: "slate",
          primaryColor: "cyan",
          bgStyle: "radial-gradient",
          headingFont: "Space Grotesk",
          bodyFont: "Open Sans",
          cardStyle: "glassmorphism",
          borderRadius: "16px",
        },
        templateValues: {
          themeMode: "dark",
          baseColor: "slate",
          primaryColor: "rose",
          bgStyle: "radial-gradient",
          headingFont: "Space Grotesk",
          bodyFont: "Open Sans",
          cardStyle: "glassmorphism",
          borderRadius: "16px",
        },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { markdown: string };
    // cyan primary #06b6d4 should be replaced with rose primary #f43f5e
    expect(data.markdown).toContain("#f43f5e");
    expect(data.markdown).not.toContain("#06b6d4");
  });
});
