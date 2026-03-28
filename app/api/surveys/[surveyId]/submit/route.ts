import { db } from '@/lib/db'
import { survey, response, question } from '@/lib/db/survey-schema'
import { eq, and, or } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { surveyId } = await params

  let answers: Record<string, string | string[]>
  try {
    const body = await request.json()
    answers = (body as { answers?: unknown }).answers as Record<string, string | string[]>
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return Response.json({ error: 'Invalid answers payload' }, { status: 400 })
  }

  // Verify survey exists and is published (support both ID and slug)
  const s = await db.query.survey.findFirst({
    where: and(
      or(eq(survey.id, surveyId), eq(survey.slug, surveyId)),
      eq(survey.status, 'published'),
    ),
  })

  if (!s) {
    return Response.json({ error: 'Survey not found or not published' }, { status: 404 })
  }

  // Load questions to validate answer keys, types, and required fields
  const qs = await db.query.question.findMany({
    where: eq(question.surveyId, s.id),
    columns: { id: true, required: true },
  })

  const allowed = new Set(qs.map((q) => q.id))
  for (const [qid, value] of Object.entries(answers)) {
    const validValue =
      typeof value === 'string' ||
      (Array.isArray(value) && value.every((v) => typeof v === 'string'))
    if (!allowed.has(qid) || !validValue) {
      return Response.json({ error: 'Invalid answer set' }, { status: 400 })
    }
  }

  for (const q of qs) {
    if (q.required && !(q.id in answers)) {
      return Response.json({ error: 'Missing required answers' }, { status: 400 })
    }
  }

  // Insert response using the actual survey ID
  await db.insert(response).values({
    id: crypto.randomUUID(),
    surveyId: s.id,
    answers,
  })

  return Response.json({ success: true })
}
