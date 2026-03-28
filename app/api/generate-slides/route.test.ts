import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai", () => ({
  generate: vi.fn(),
}));

import { POST } from "./route";

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
});
