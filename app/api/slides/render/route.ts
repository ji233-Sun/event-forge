import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { parseSlides } from "@/lib/slides";

type RenderRequestBody = {
  markdown?: unknown;
};

/**
 * This endpoint now simply validates and parses the markdown,
 * returning the split slides. Actual rendering happens client-side.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RenderRequestBody;

  try {
    body = (await request.json()) as RenderRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.markdown !== "string" || body.markdown.trim() === "") {
    return Response.json({ error: "markdown is required" }, { status: 400 });
  }

  try {
    const slides = parseSlides(body.markdown);
    return Response.json({ slides, count: slides.length });
  } catch (error) {
    console.error("[slides/render] failed:", error);
    return Response.json(
      { error: "Failed to parse markdown" },
      { status: 500 },
    );
  }
}
