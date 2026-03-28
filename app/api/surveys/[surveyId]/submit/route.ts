import { db } from '@/lib/db'
import { survey, response } from '@/lib/db/survey-schema'
import { eq, and, or } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { surveyId } = await params
  const body = await request.json()
  const { answers } = body as { answers: Record<string, string | string[]> }

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

  // Insert response using the actual survey ID
  await db.insert(response).values({
    id: crypto.randomUUID(),
    surveyId: s.id,
    answers,
  })

  return Response.json({ success: true })
}
