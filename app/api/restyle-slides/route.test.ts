import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRender, mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockRender: vi.fn(() => ({
    html: "<section>Restyled</section>",
    css: "section { color: blue; }",
  })),
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("@marp-team/marp-core", () => ({
  default: class MockMarp {
    render = mockRender;
  },
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
  mockRender.mockReset();
  mockGetSession.mockReset();
  mockHeaders.mockReset();
  mockRender.mockImplementation(() => ({
    html: "<section>Restyled</section>",
    css: "section { color: blue; }",
  }));
});

const SAMPLE_MARKDOWN = `---
marp: true
theme: default
paginate: true
style: |
  section { background: #000; }
---

# Title
`;

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

  it("returns html, css, markdown on success with default template", async () => {
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: SAMPLE_MARKDOWN }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json() as { html: string; css: string; markdown: string };
    expect(data.html).toBeDefined();
    expect(data.css).toBeDefined();
    expect(data.markdown).toBeDefined();
  });

  it("calls Marp.render with the restyled markdown", async () => {
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: SAMPLE_MARKDOWN,
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
    expect(mockRender).toHaveBeenCalledOnce();
    // The rendered markdown should have new style injected
    expect(mockRender).toHaveBeenCalledWith(expect.stringContaining("style: |"));
    expect(mockRender).not.toHaveBeenCalledWith(expect.stringContaining("[GENERATE HEX]"));
  });

  it("returns 502 when Marp render throws", async () => {
    mockRender.mockImplementationOnce(() => { throw new Error("render error"); });
    const req = new Request("http://localhost/api/restyle-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: SAMPLE_MARKDOWN }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
