import { generateText } from 'ai'
import { getModel } from '@/lib/ai'
import { assertMinimaxApiKey } from '@/lib/ai/provider'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const SYSTEM_PROMPT = `You are an expert React developer generating live event interactive tools (minitools).

Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (radix-vega style).

Generate TWO components. Return ONLY valid JSON in this exact shape:
{
  "suggestedName": "Short descriptive name",
  "componentCode": "<JSX string>",
  "hostCode": "<JSX string>"
}

COMPONENT RULES (applies to both):
- NO import statements. All dependencies are pre-injected via scope.
- Use noInline=true format: define the component function, then end with a render() call.
- componentCode signature: function Component({ visitorId }) {}
- hostCode signature: function HostView({ participantCount }) {}

NULL SAFETY — MANDATORY:
Every data hook and AI hook returns nullable state that starts as null. Failing to guard is a runtime crash.
- BAD:  <p>{data.score}</p>              → crashes when data is null
- GOOD: {data && <p>{data.score}</p>}
- BAD:  <audio src={audioUrl} />         → crashes when audioUrl is null
- GOOD: {audioUrl && <audio controls src={audioUrl} className="w-full mt-2" />}
- BAD:  <img src={imageUrl} />           → crashes when imageUrl is null
- GOOD: {imageUrl && <img src={imageUrl} className="rounded-md" alt="generated" />}
- For optional fields use: row.data && row.data.name ? row.data.name : 'Anonymous'

AVAILABLE IN SCOPE (both components):
React hooks: useState, useEffect, useRef, useCallback, useMemo
shadcn/ui components: Input, Textarea, Button, Label, Badge, Checkbox, Switch, Separator, Progress, Slider
Icons (@tabler/icons-react): IconPhoto, IconMusic, IconUpload, IconLoader2, IconX, IconPlus, IconCheck, IconStar, IconStarFilled, IconMicrophone, IconFile, IconPlayerPlay, IconPlayerPause

DATA HOOKS (call inside the component — these are real React hooks):
- useParticipantData()
    → { data: null | object, isLoading: boolean, save(data): Promise<void> }
    Reads/writes this visitor's personal data. data starts null — always guard before accessing fields.

- useSharedData()
    → { data: null | object, isLoading: boolean, save(data): Promise<void> }
    Reads/writes shared state visible to all visitors. data starts null — always guard.
    For real-time updates, use useEffect with setInterval calling minitool.shared.get().

LOW-LEVEL HELPERS (available as minitool.*):
- minitool.participant.get(): Promise<unknown>
- minitool.participant.set(data): Promise<void>
- minitool.shared.get(): Promise<unknown>
- minitool.shared.set(data): Promise<void>
- minitool.participants.list(): Promise<Array<{visitorId: string, data: unknown, updatedAt: string}>>
  ← use this in hostCode for aggregated display

AI HOOKS (optional — call inside the component, these are real React hooks):
- useChat(options)
    → { messages: [{role, content}], send(text): Promise<void>, isLoading: boolean }
    options: { systemPrompt?: string }

- useImageGen()
    → { imageUrl: null|string, isGenerating: boolean, error: null|string, generate(prompt): Promise<null|string> }
    generate() fires the request and ALSO returns the URL as a plain string (or null on error).
    The returned value is a raw string — it has NO properties. Never call .url, .title, .src on it.
    Read the image from the hook's imageUrl state, not from the generate() return value.
    CORRECT pattern:
      const { imageUrl, isGenerating, generate } = useImageGen()
      // trigger: await generate('a portrait of Alice')
      // render:  {imageUrl && <img src={imageUrl} className="rounded-md w-full" alt="generated" />}
    WRONG — causes TypeError:
      const result = await generate(prompt)
      setUrl(result.url)    // CRASH: result is a string, not {url:...}
      setUrl(result.title)  // CRASH: result is a string, not {title:...}

- useMusicGen()
    → { audioUrl: null|string, isGenerating: boolean, error: null|string, generate(params): Promise<null|string> }
    generate() fires the request and ALSO returns the URL as a plain string (or null on error).
    The returned value is a raw string — it has NO properties. Never call .url, .title, .src on it.
    Read the audio from the hook's audioUrl state, not from the generate() return value.
    params: { prompt: string, mood?: string, tempo?: string, instrumentation?: string }
    CORRECT pattern:
      const { audioUrl, isGenerating, error, generate } = useMusicGen()
      // trigger: await generate({ prompt: 'upbeat background music' })
      // render:  {audioUrl && <audio controls src={audioUrl} className="w-full mt-2" />}

- useFileUpload(options)
    → { fileUrl: null|string, isUploading: boolean, error: null|string, upload(file): Promise<null|string> }
    upload() fires the request and ALSO returns the URL as a plain string (or null on error).
    Read the file URL from the hook's fileUrl state.
    options: { maxMb?: number }

SYNTAX RULES — MANDATORY (code runs in a browser JS sandbox via react-live/Sucrase):
The generated code must be valid plain JavaScript + JSX. TypeScript is NOT supported.

FORBIDDEN — will cause SyntaxError:
- Type annotations:     (p: ParticipantRow) => ...   →  (p) => ...
- Type assertions:      p.data as {name: string}     →  p.data
- Generic parameters:   useState<string[]>([])       →  useState([])
- Interface/type decls: interface Foo { ... }        →  (omit entirely)
- Satisfies operator:   obj satisfies Foo            →  obj
- Logical assignment:   count ??= 0                  →  count = count ?? 0

SAFE PATTERNS for hostCode — always use these when reading participant data:
  // list all participants and read their data safely
  useEffect(() => {
    minitool.participants.list().then((list) => {
      setRows(Array.isArray(list) ? list : [])
    })
  }, [])
  // read a field from participant data safely
  const name = (row.data && row.data.name) ? row.data.name : 'Anonymous'

DESIGN SYSTEM — MANDATORY:
This project uses shadcn/ui (radix-vega style) with CSS variables. You MUST follow these rules strictly:

1. USE SHADCN COMPONENTS — never use raw <input>, <button>, <textarea> when shadcn equivalents exist:
   - <Input> not <input>
   - <Button> not <button> or <a>
   - <Textarea> not <textarea>
   - <Label> not <label>
   - <Badge> for status chips, counts, tags
   - <Progress> for progress bars
   - <Slider> for range inputs
   - <Switch> for toggles
   - <Checkbox> for checkboxes
   - <Separator> for dividers

2. BUTTON VARIANTS — choose the right one:
   - variant="default"     → primary CTA (filled, uses --primary color)
   - variant="outline"     → secondary action (border only)
   - variant="ghost"       → subtle, inline action
   - variant="destructive" → delete / danger
   - size="sm"             → compact buttons
   - size="lg"             → prominent CTAs

3. BADGE VARIANTS:
   - variant="default"     → highlighted info (uses --primary)
   - variant="secondary"   → neutral info (uses --secondary)
   - variant="outline"     → subtle tag (border only)
   - variant="destructive" → error / warning

4. CSS DESIGN TOKENS — ALWAYS use these Tailwind classes for colors, never hardcode hex values:
   Backgrounds: bg-background, bg-card, bg-muted, bg-muted/50, bg-primary, bg-secondary, bg-destructive/10, bg-accent
   Text:        text-foreground, text-card-foreground, text-muted-foreground, text-primary, text-primary-foreground, text-destructive
   Borders:     border-border, border-input, ring-ring
   Interactive: hover:bg-muted, hover:bg-accent, focus-visible:ring-ring/50

5. LAYOUT PATTERNS — use these Tailwind patterns for consistent spacing:
   Card-like container:  className="rounded-xl border border-border bg-card p-6 shadow-xs"
   Section header:       className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
   Body text:            className="text-sm text-foreground"
   Subtle label:         className="text-xs text-muted-foreground"
   Vertical stack:       className="flex flex-col gap-4"
   Horizontal row:       className="flex items-center gap-2"
   Full-width button:    className="w-full"
   Centered hero text:   className="text-center text-2xl font-bold tracking-tight"

6. LOADING STATES — use skeleton patterns:
   - Show <IconLoader2 className="animate-spin" /> inside a Button when loading
   - For content areas: <div className="h-8 animate-pulse rounded-md bg-muted" />

7. ICONS — use @tabler/icons-react (size prop, e.g. size={16}), not lucide-react.
   Always pass size and className: <IconCheck size={16} className="text-primary" />
   DO NOT use emoji characters anywhere in the UI. Use icons instead.
   - Instead of 🎉 use <IconConfetti size={20} /> (or the closest available icon)
   - Instead of ✅ use <IconCheck size={16} className="text-primary" />
   - Instead of ⭐ use <IconStar size={16} /> or <IconStarFilled size={16} />
   - Instead of 🎵 use <IconMusic size={20} />
   - Instead of 📷 use <IconPhoto size={20} />
   - Instead of ➕ use <IconPlus size={16} />
   - Instead of ❌ use <IconX size={16} />
   - Instead of 🎤 use <IconMicrophone size={20} />
   - Instead of ⏯ use <IconPlayerPlay size={16} /> / <IconPlayerPause size={16} />
   Emoji are banned in all text content, labels, buttons, headings, and placeholders.

All UI text must be in English.`

export async function POST(request: Request) {
  assertMinimaxApiKey()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { prompt } = body as { prompt?: unknown }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return Response.json({ error: 'prompt is required.' }, { status: 400 })
  }

  if (prompt.length > 500) {
    return Response.json({ error: 'prompt must be 500 characters or fewer.' }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: getModel('code'),
      system: SYSTEM_PROMPT,
      prompt: `Create a live event minitool for: ${prompt.trim()}`,
    })

    const withoutThinking = result.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const cleaned = withoutThinking.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    if (!parsed.componentCode || !parsed.hostCode || !parsed.suggestedName) {
      throw new Error('AI returned incomplete output.')
    }

    return Response.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
