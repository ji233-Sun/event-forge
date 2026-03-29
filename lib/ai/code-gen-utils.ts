/**
 * Extract the outermost JSON object from a model response that may contain
 * markdown fences, explanation text, or chain-of-thought content.
 * Throws if no JSON object is found.
 *
 * Uses brace-depth counter to correctly identify the closing brace of the first
 * opening brace, handling escapes and string literals.
 */
export function extractJson(raw: string): string {
  const start = raw.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response.')

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return raw.slice(start, i + 1)
    }
  }

  throw new Error('No JSON object found in response.')
}

/**
 * Returns true if the string contains TypeScript-specific syntax that would
 * break the Sucrase/react-live browser sandbox.
 *
 * Does NOT match JSX component open tags like <Button> or <Input>.
 * Does NOT false-positive on object props like { color: red, gap: 4 }.
 */
const TS_PATTERN =
  /:\s*(?:string|number|boolean|void|never|any|unknown)\b|:\s*[A-Z][a-zA-Z<>[\]|]+|\binterface\b|\btype\b\s+\w+\s*=|\bas\s+[A-Z]\w*|\benum\b|\w+<(?:string|number|boolean|any|unknown|void|never|HTML\w+|[A-Z]\w+|[^>]*[\[\]|,][^>]*)>|!\./

export function hasTypeScript(code: string): boolean {
  return TS_PATTERN.test(code)
}
