import { generateText } from 'ai'
import { getModel } from '@/lib/ai'
import { assertMinimaxApiKey } from '@/lib/ai/provider'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const SYSTEM_PROMPT = `You are fixing a broken React/JSX component running in a react-live sandbox (Sucrase-based browser runtime).

Given the broken code and the error message, return ONLY valid JSON:
{ "fixedCode": "<corrected code string>" }

SANDBOX RULES — the code must NOT contain:
- TypeScript syntax: type annotations (x: string), generics (useState<T>()), as-casts, interface/type declarations
- import/export statements (all dependencies are pre-injected via scope)
- Logical assignment operators: ??=, ||=, &&=

COMMON FIXES:
- "Cannot read properties of undefined (reading 'X')" → add a guard before accessing X
  BAD:  obj.X                  GOOD: obj && obj.X != null ? obj.X : fallback
  BAD:  question.title         GOOD: question ? question.title : ''
  BAD:  value.nickname         GOOD: (value && value.nickname) ? value.nickname : ''

- "Cannot read properties of null" → same null guard pattern

- result.title / .url on a generate() return value → generate() returns a plain string, not an object
  BAD:  const r = await generate(p); setUrl(r.title)
  GOOD: await generate(p)   — then read the hook state: imageUrl / audioUrl / fileUrl

- SyntaxError (unexpected token) → strip TypeScript syntax
  Remove: type annotations, generic parameters, as-casts, interface/type declarations

- "X is not a function" → verify the hook or function name matches what is available in scope

Fix ONLY what causes the error. Return the complete corrected code including all helper functions and the final render() call.`

export async function POST(request: Request) {
  assertMinimaxApiKey()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { code, error } = body as { code?: unknown; error?: unknown }

  if (typeof code !== 'string' || !code.trim()) {
    return Response.json({ error: 'code is required.' }, { status: 400 })
  }
  if (typeof error !== 'string' || !error.trim()) {
    return Response.json({ error: 'error is required.' }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: getModel('code'),
      system: SYSTEM_PROMPT,
      prompt: `ERROR:\n${error.trim()}\n\nCODE:\n${code.trim()}`,
    })

    const withoutThinking = result.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const cleaned = withoutThinking.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    if (!parsed.fixedCode || typeof parsed.fixedCode !== 'string') {
      throw new Error('AI returned incomplete output.')
    }

    return Response.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fix failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
