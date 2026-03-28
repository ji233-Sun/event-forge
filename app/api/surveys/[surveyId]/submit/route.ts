import { db } from '@/lib/db'
import { survey, response } from '@/lib/db/survey-schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { surveyId } = await params
  const body = await request.json()
  const { answers } = body as { answers: Record<string, string | string[]> }

  // Verify survey exists and is published
  const s = await db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.status, 'published')),
  })

  if (!s) {
    return Response.json({ error: 'Survey not found or not published' }, { status: 404 })
  }

  // Insert response
  await db.insert(response).values({
    id: crypto.randomUUID(),
    surveyId,
    answers,
  })

  return Response.json({ success: true })
}
