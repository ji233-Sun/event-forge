import { generateText } from 'ai'
import { getModel } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const SYSTEM_PROMPT = `You are an expert React developer generating custom survey question components.

Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (radix-vega style).

Generate TWO components and ONE schema. Return ONLY valid JSON in this exact shape:
{
  "suggestedName": "Short descriptive name",
  "formCode": "<JSX string — see rules below>",
  "displayCode": "<JSX string — see rules below>",
  "answerSchema": { "type": "object", "properties": { ... }, "required": [...] }
}

COMPONENT RULES (applies to both formCode and displayCode):
- NO import statements. All dependencies are pre-injected via scope.
- Use noInline=true format: define the component function, then end with a render() call.
- formCode component signature: function Component({ value, onChange, question }) {}
  - value: current answer object (may be undefined on first render — always guard: value?.field ?? defaultValue)
  - onChange: call with a JSON-serializable object whenever the answer changes
  - question: { title: string, description: string | null }
- displayCode component signature: function Display({ answer }) {}
  - answer: the saved answer object — may be undefined or null
  - ALWAYS guard at the top: if (!answer) return <p className="text-sm text-muted-foreground">No answer yet.</p>
  - render it clearly for statistics/results

NULL SAFETY — MANDATORY:
Every AI hook returns nullable state that starts as null. Failing to guard is a runtime crash.
- BAD:  <audio src={audioUrl} />           → crashes when audioUrl is null
- GOOD: {audioUrl && <audio controls src={audioUrl} className="w-full mt-2" />}
- BAD:  <img src={imageUrl} />             → crashes when imageUrl is null
- GOOD: {imageUrl && <img src={imageUrl} className="rounded-md" alt="generated" />}
- BAD:  answer.title                       → crashes when answer is undefined
- GOOD: answer?.title ?? 'Untitled'

AVAILABLE IN SCOPE:
React hooks: useState, useEffect, useRef, useCallback, useMemo
shadcn/ui components: Input, Textarea, Button, Label, Badge, Checkbox, Switch, Separator, Progress, Slider
Icons (@tabler/icons-react): IconPhoto, IconMusic, IconUpload, IconLoader2, IconX, IconPlus, IconCheck, IconStar, IconStarFilled, IconMicrophone, IconFile, IconPlayerPlay, IconPlayerPause
AI hooks (call inside the component — these are real React hooks):
  - useChat(options)
      → { messages: [{role, content}], send(text): Promise<void>, isLoading: boolean }
      options: { systemPrompt?: string }
  - useImageGen()
      → { imageUrl: null|string, isGenerating: boolean, error: null|string, generate(prompt): Promise<null|string> }
      generate() fires the request, sets imageUrl, and returns the URL string (or null on error).
      Do NOT call .title or any property on the return value — it is a plain string or null.
  - useMusicGen()
      → { audioUrl: null|string, isGenerating: boolean, error: null|string, generate(params): Promise<null|string> }
      generate() fires the request, sets audioUrl, and returns the URL string (or null on error).
      Do NOT call .title or any property on the return value — it is a plain string or null.
      params: { prompt: string, mood?: string, tempo?: string, instrumentation?: string }
      Minimal correct usage:
        const { audioUrl, isGenerating, error, generate } = useMusicGen()
        // call: await generate({ prompt: 'upbeat pop song for Alice' })
        // render: {audioUrl && <audio controls src={audioUrl} className="w-full mt-2" />}
  - useFileUpload(options)
      → { fileUrl: null|string, isUploading: boolean, error: null|string, upload(file): Promise<null|string> }
      upload() fires the request, sets fileUrl, and returns the URL string (or null on error).
      options: { maxMb?: number }

SYNTAX RULES — MANDATORY (code runs in a browser JS sandbox via react-live/Sucrase):
The generated code must be valid plain JavaScript + JSX. TypeScript is NOT supported.

FORBIDDEN — will cause SyntaxError:
- Type annotations:     (p: ParticipantRow) => ...   →  (p) => ...
- Type assertions:      value as string              →  value
- Generic parameters:   useState<string[]>([])       →  useState([])
- Interface/type decls: interface Foo { ... }        →  (omit entirely)
- Satisfies operator:   obj satisfies Foo            →  obj
- Logical assignment:   count ??= 0                  →  count = count ?? 0

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

3. CSS DESIGN TOKENS — ALWAYS use these Tailwind classes for colors, never hardcode hex values:
   Backgrounds: bg-background, bg-card, bg-muted, bg-muted/50, bg-primary, bg-secondary, bg-destructive/10
   Text:        text-foreground, text-muted-foreground, text-primary, text-primary-foreground, text-destructive
   Borders:     border-border, border-input

4. LAYOUT PATTERNS:
   Vertical stack:   className="flex flex-col gap-4"  (or space-y-3)
   Horizontal row:   className="flex items-center gap-2"
   Body text:        className="text-sm text-foreground"
   Subtle label:     className="text-xs text-muted-foreground"

5. LOADING STATES:
   - Show <IconLoader2 className="animate-spin" size={16} /> inside a Button when loading
   - For content areas: <div className="h-8 animate-pulse rounded-md bg-muted" />

6. ICONS — use @tabler/icons-react (size prop, e.g. size={16}), not lucide-react.
   Always pass size and className: <IconCheck size={16} className="text-primary" />
   DO NOT use emoji anywhere in the UI. Use icons instead.
   Emoji are banned in all text content, labels, buttons, headings, and placeholders.

All UI text must be in English.`

export async function POST(request: Request) {
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
      prompt: `Create a custom survey question type for: ${prompt.trim()}`,
    })

    const withoutThinking = result.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const cleaned = withoutThinking.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    if (!parsed.formCode || !parsed.displayCode || !parsed.answerSchema || !parsed.suggestedName) {
      throw new Error('AI returned incomplete output.')
    }

    return Response.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed.'
    return Response.json({ error: message }, { status: 500 })
  }
}
