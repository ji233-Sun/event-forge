/**
 * Split a full Markdown slide document into per-slide segments.
 * Slides are separated by --- on its own line.
 * Strips any YAML front-matter (legacy Marp format) before splitting.
 */
export function parseSlides(markdown: string): string[] {
  // Strip YAML front-matter if present (legacy compatibility)
  const cleaned = markdown
    .replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "")
    .trim();

  if (!cleaned) return [];

  return cleaned
    .split(/\r?\n---\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extract a display title from a single slide segment.
 * Checks for markdown # / ## heading, returns fallback if not found.
 */
export function getSlideTitle(segment: string, fallback: string): string {
  const mdMatch = segment.match(/^#{1,2}\s+(.+)$/m);
  if (mdMatch) return mdMatch[1].trim();

  return fallback;
}

/**
 * Re-join slide segments into a full Markdown document.
 */
export function joinSlides(segments: string[]): string {
  return segments.join("\n\n---\n\n");
}
