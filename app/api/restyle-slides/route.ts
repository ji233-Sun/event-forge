import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isPlainObject } from "@/lib/api-utils";
import { resolvePalette } from "@/lib/slides/template/css-builder";
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

/**
 * Replace hex color literals in echarts code blocks when the palette changes.
 * Matches ```echarts blocks and substitutes old palette colors with new ones.
 */
function replaceEChartsColors(
  markdown: string,
  oldPalette: ReturnType<typeof resolvePalette>,
  newPalette: ReturnType<typeof resolvePalette>,
): string {
  const map = new Map<string, string>();
  for (const key of Object.keys(oldPalette) as Array<keyof typeof oldPalette>) {
    const oldColor = oldPalette[key];
    const newColor = newPalette[key];
    if (oldColor && newColor && oldColor.toLowerCase() !== newColor.toLowerCase()) {
      map.set(oldColor.toLowerCase(), newColor);
    }
  }
  if (map.size === 0) return markdown;

  // Replace within ```echarts code blocks
  return markdown.replace(/```echarts\s*\n([\s\S]*?)```/g, (_, json: string) => {
    const updated = json.replace(/#[0-9a-fA-F]{6}/g, (hex) => map.get(hex.toLowerCase()) ?? hex);
    return "```echarts\n" + updated + "```";
  });
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

  const newValues: TemplateValues = isValidTemplateValues(templateValues)
    ? templateValues
    : DEFAULT_TEMPLATE_VALUES;

  const oldPalette = resolvePalette(
    isValidTemplateValues(prevTemplateValues) ? prevTemplateValues : newValues,
  );
  const newPalette = resolvePalette(newValues);

  const restyled = replaceEChartsColors(markdown, oldPalette, newPalette);

  return Response.json({ markdown: restyled });
}
