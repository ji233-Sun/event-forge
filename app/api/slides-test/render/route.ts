import Marp from "@marp-team/marp-core";

type RenderRequestBody = {
  markdown?: unknown;
};

export async function POST(request: Request) {
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
    const marp = new Marp({ html: true });
    const { html, css } = marp.render(body.markdown);
    return Response.json({ html, css });
  } catch (error) {
    console.error("[slides-test/render] failed:", error);
    return Response.json(
      { error: "Failed to render markdown with Marp" },
      { status: 500 }
    );
  }
}
