import Marp from "@marp-team/marp-core";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isPlainObject } from "@/lib/api-utils";
import { buildDynamicStyle, replaceEChartsColors, replaceMarkdownStyle } from "@/lib/slides/template/css-builder";
import { DEFAULT_TEMPLATE_VALUES, TEMPLATE_OPTIONS, type TemplateValues } from "@/lib/slides/template/config";

function isValidTemplateValues(v: unknown): v is TemplateValues {
  if (!isPlainObject(v)) return false;
  return (Object.entries(TEMPLATE_OPTIONS) as Array<[keyof TemplateValues, readonly string[]]>).every(
    ([key, options]) => {
      const value = (v as Record<string, unknown>)[key];
      return typeof value === "string" && (options as readonly string[]).includes(value);
    },
  );
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { markdown, templateValues, prevTemplateValues } = body as {
    markdown?: unknown;
    templateValues?: unknown;
    prevTemplateValues?: unknown;
  };

  if (typeof markdown !== "string" || markdown.trim() === "") {
    return Response.json({ error: "markdown is required" }, { status: 400 });
  }

  const values: TemplateValues = isValidTemplateValues(templateValues)
    ? templateValues
    : DEFAULT_TEMPLATE_VALUES;

  const { style: newStyle, palette: newPalette } = buildDynamicStyle(values);
  const { palette: oldPalette } = buildDynamicStyle(
    isValidTemplateValues(prevTemplateValues) ? prevTemplateValues : values
  );

  let restyled = replaceMarkdownStyle(markdown, newStyle);
  restyled = replaceEChartsColors(restyled, oldPalette, newPalette);

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
