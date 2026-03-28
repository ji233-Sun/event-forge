import {
  TEMPLATE_KEYS,
  TEMPLATE_OPTIONS,
  type TemplateValues,
} from "./template-config";

function toBase64Url(input: string): string {
  const base64 =
    typeof window === "undefined"
      ? Buffer.from(input, "utf8").toString("base64")
      : window.btoa(input);

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string | null {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  try {
    if (typeof window === "undefined") {
      return Buffer.from(padded, "base64").toString("utf8");
    }

    return window.atob(padded);
  } catch {
    return null;
  }
}

function normalizeCode(raw: string): string {
  return raw.trim().replace(/^--preset\s+/i, "");
}

export function encodePreset(values: TemplateValues): string {
  const indexes = TEMPLATE_KEYS.map((key) => {
    const options = TEMPLATE_OPTIONS[key] as readonly string[];
    const idx = options.indexOf(values[key]);
    return idx >= 0 ? idx : 0;
  });

  return toBase64Url(indexes.join("."));
}

export function decodePreset(code: string): TemplateValues | null {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return null;
  }

  const decoded = fromBase64Url(normalized);
  if (!decoded) {
    return null;
  }

  const indexes = decoded.split(".").map((item) => Number.parseInt(item, 10));
  if (indexes.length !== TEMPLATE_KEYS.length || indexes.some((idx) => Number.isNaN(idx))) {
    return null;
  }

  const result = {} as Record<keyof TemplateValues, string>;

  for (const [idx, key] of TEMPLATE_KEYS.entries()) {
    const options = TEMPLATE_OPTIONS[key];
    const optionIndex = indexes[idx];
    const value = options[optionIndex];
    if (!value) {
      return null;
    }
    result[key] = value;
  }

  return result as TemplateValues;
}

export function formatPresetCode(code: string): string {
  return `--preset ${code}`;
}
