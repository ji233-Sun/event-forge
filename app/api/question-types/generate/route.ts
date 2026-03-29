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
  - value: current answer (may be undefined initially)
  - onChange: call with the new answer whenever it changes (answer must be JSON-serializable)
  - question: { title: string, description: string | null }
- displayCode component signature: function Display({ answer }) {}
  - answer: the saved answer object — render it clearly for statistics/results

AVAILABLE IN SCOPE:
React hooks: useState, useEffect, useRef, useCallback, useMemo
UI: Input, Textarea, Button, Label, Badge, Checkbox, Switch, Separator, Progress, Slider
Icons: IconPhoto, IconMusic, IconUpload, IconLoader2, IconX, IconPlus, IconCheck, IconStar, IconStarFilled, IconMicrophone, IconFile, IconPlayerPlay, IconPlayerPause
AI hooks (call these inside the component — they are real React hooks):
  - useChat(options?: { systemPrompt?: string }) → { messages, send, isLoading }
  - useImageGen() → { imageUrl, isGenerating, error, generate(prompt) }
  - useMusicGen() → { audioUrl, isGenerating, error, generate({ prompt, durationSeconds?, mood?, tempo?, instrumentation? }) }
  - useFileUpload(options?: { maxMb?: number }) → { fileUrl, isUploading, error, upload(file) }

STYLING: Use Tailwind classes. Use "space-y-3", "flex gap-2", "text-sm text-muted-foreground", etc.
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

    const cleaned = result.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
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
