/**
 * Extract the outermost JSON object from a model response that may contain
 * markdown fences, explanation text, or chain-of-thought content.
 * Throws if no JSON object is found.
 */
export function extractJson(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in response.')
  }
  return raw.slice(start, end + 1)
}

/**
 * Returns true if the string contains TypeScript-specific syntax that would
 * break the Sucrase/react-live browser sandbox.
 *
 * Does NOT match JSX component open tags like <Button> or <Input>.
 */
const TS_PATTERN =
  /:\s*[A-Za-z_$]|\binterface\b|\btype\b\s+\w+\s*=|\bas\s+[A-Z]\w*|\benum\b|!\.|\w+<[^>]*[\[\]|,][^>]*>/

export function hasTypeScript(code: string): boolean {
  return TS_PATTERN.test(code)
}
