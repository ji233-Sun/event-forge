import { generateText } from 'ai'
import { getModel } from '@/lib/ai'

const MAX_MESSAGES = 20
const MAX_CONTENT_LENGTH = 2000

type Message = { role: 'user' | 'assistant'; content: string }

function isValidMessages(messages: unknown): messages is Message[] {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= MAX_MESSAGES &&
    messages.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= MAX_CONTENT_LENGTH,
    )
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { messages, systemPrompt } = body as { messages: unknown; systemPrompt?: unknown }

  if (!isValidMessages(messages)) {
    return Response.json({ error: 'messages must be a non-empty array of up to 20 items.' }, { status: 400 })
  }

  const system = typeof systemPrompt === 'string' && systemPrompt.length <= 500
    ? systemPrompt
    : 'You are a helpful survey assistant.'

  const { text } = await generateText({
    model: getModel('simple'),
    system,
    messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
  })

  return Response.json({ text })
}
