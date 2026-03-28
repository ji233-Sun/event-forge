/**
 * Split a full Marp markdown document into per-slide segments.
 * Segment 0 includes the YAML front-matter (if present).
 * Segments are split on LF or CRLF `---` separators.
 */
export function parseSlides(markdown: string): string[] {
  const fmMatch = markdown.match(/^(---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$))/)
  if (!fmMatch) {
    return markdown
      .split(/\r?\n---\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const frontMatter = fmMatch[1]
  const rest = markdown.slice(frontMatter.length)
  const segments = rest.split(/\r?\n---\r?\n/)
  segments[0] = frontMatter + segments[0]
  return segments.map((s) => s.trim()).filter(Boolean)
}

/**
 * Extract a display title from a single slide segment.
 * Returns the text of the first # or ## heading, or `fallback`.
 */
export function getSlideTitle(segment: string, fallback: string): string {
  const match = segment.match(/^#{1,2}\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

/**
 * Re-join slide segments into a full Marp markdown document.
 * Produces semantically equivalent markdown — parseSlides normalizes
 * surrounding whitespace, so the result is not byte-identical to the
 * original but renders identically in Marp.
 */
export function joinSlides(segments: string[]): string {
  return segments.join('\n\n---\n\n')
}
