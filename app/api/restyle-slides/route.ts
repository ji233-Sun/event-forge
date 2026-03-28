import Marp from "@marp-team/marp-core";
import { isPlainObject } from "@/lib/api-utils";
import { buildDynamicStyle, replaceMarkdownStyle } from "@/lib/slides/template/css-builder";
import { DEFAULT_TEMPLATE_VALUES, type TemplateValues } from "@/lib/slides/template/config";

function isValidTemplateValues(v: unknown): v is TemplateValues {
  if (!isPlainObject(v)) return false;
  const keys: Array<keyof TemplateValues> = [
    "themeMode", "baseColor", "primaryColor", "bgStyle",
    "headingFont", "bodyFont", "cardStyle", "borderRadius",
  ];
  return keys.every((k) => typeof (v as Record<string, unknown>)[k] === "string");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { markdown, templateValues } = body as {
    markdown?: unknown;
    templateValues?: unknown;
  };

  if (typeof markdown !== "string" || markdown.trim() === "") {
    return Response.json({ error: "markdown is required" }, { status: 400 });
  }

  const values: TemplateValues = isValidTemplateValues(templateValues)
    ? templateValues
    : DEFAULT_TEMPLATE_VALUES;

  const { style } = buildDynamicStyle(values);
  const restyled = replaceMarkdownStyle(markdown, style);

  let html: string;
  let css: string;
  try {
    const marp = new Marp({ html: true });
    ({ html, css } = marp.render(restyled));
  } catch (error) {
    console.error("[restyle-slides] render failed:", error);
    return Response.json({ error: "Failed to render restyled slides." }, { status: 502 });
  }

  return Response.json({ html, css, markdown: restyled });
}
