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
Every data hook returns null until data loads. Never render null values directly.
- BAD:  <p>{data.score}</p>          → crashes when data is null
- GOOD: {data && <p>{data.score}</p>}
- BAD:  <audio src={audioUrl} />     → crashes when null
- GOOD: {audioUrl && <audio controls src={audioUrl} className="w-full" />}

AVAILABLE IN SCOPE (both components):
React hooks: useState, useEffect, useRef, useCallback, useMemo
UI: Input, Textarea, Button, Label, Badge, Checkbox, Switch, Separator, Progress, Slider
Icons: IconPhoto, IconMusic, IconUpload, IconLoader2, IconX, IconPlus, IconCheck, IconStar, IconStarFilled, IconMicrophone, IconFile, IconPlayerPlay, IconPlayerPause

DATA HOOKS (use in componentCode):
- useParticipantData<T>()
    → { data: T | null, isLoading: boolean, save(data: T): Promise<void> }
    Reads/writes this visitor's personal data. data starts null — always guard.

- useSharedData<T>()
    → { data: T | null, isLoading: boolean, save(data: T): Promise<void> }
    Reads/writes shared state visible to all visitors. data starts null — always guard.
    For real-time updates, use useEffect with setInterval calling minitool.shared.get().

LOW-LEVEL HELPERS (available as minitool.*):
- minitool.participant.get(): Promise<unknown>
- minitool.participant.set(data: unknown): Promise<void>
- minitool.shared.get(): Promise<unknown>
- minitool.shared.set(data: unknown): Promise<void>
- minitool.participants.list(): Promise<{visitorId: string, data: unknown, updatedAt: string}[]>
  ← use this in hostCode for aggregated display

AI HOOKS (optional):
- useChat(options?: { systemPrompt?: string })
    → { messages: {role,content}[], send(text: string): Promise<void>, isLoading: boolean }
- useImageGen()
    → { imageUrl: string|null, isGenerating: boolean, error: string|null, generate(prompt: string): Promise<string|null> }
- useMusicGen()
    → { audioUrl: string|null, isGenerating: boolean, error: string|null, generate(params: {prompt,mood?,tempo?,instrumentation?}): Promise<string|null> }
- useFileUpload(options?: { maxMb?: number })
    → { fileUrl: string|null, isUploading: boolean, error: string|null, upload(file: File): Promise<string|null> }

STYLING: Use Tailwind classes. All UI text must be in English.`

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
