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
 * Checks (in order): markdown # / ## heading, then HTML <h1>/<h2> tags.
 * Returns `fallback` if neither is found.
 */
export function getSlideTitle(segment: string, fallback: string): string {
  // Markdown heading: # Title or ## Title
  const mdMatch = segment.match(/^#{1,2}\s+(.+)$/m)
  if (mdMatch) return mdMatch[1].trim()

  // HTML heading: <h1>Title</h1> or <h2>Title</h2> (single line, no nested tags)
  const htmlMatch = segment.match(/<h[12][^>]*>\s*([^<]+?)\s*<\/h[12]>/i)
  if (htmlMatch) return htmlMatch[1].trim()

  return fallback
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
