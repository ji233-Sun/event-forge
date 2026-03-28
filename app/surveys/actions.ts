'use server'

import { eq, and, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { survey, question, response } from '@/lib/db/survey-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

function generateId() {
  return crypto.randomUUID()
}

function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

// ==================== Survey CRUD ====================

export async function createSurvey(title: string, description: string) {
  const user = await requireAuth()
  const id = generateId()
  await db.insert(survey).values({
    id,
    title,
    description: description || null,
    userId: user.id,
  })
  return { id }
}

export async function updateSurvey(
  surveyId: string,
  data: { title?: string; description?: string; status?: string },
) {
  const user = await requireAuth()
  const result = await db
    .update(survey)
    .set(data)
    .where(and(eq(survey.id, surveyId), eq(survey.userId, user.id)))
    .returning()
  return result[0]
}

export async function deleteSurvey(surveyId: string) {
  const user = await requireAuth()
  await db
    .delete(survey)
    .where(and(eq(survey.id, surveyId), eq(survey.userId, user.id)))
}

export async function publishSurvey(surveyId: string) {
  const user = await requireAuth()
  const slug = generateSlug()
  const result = await db
    .update(survey)
    .set({ status: 'published', slug })
    .where(and(eq(survey.id, surveyId), eq(survey.userId, user.id)))
    .returning()
  return result[0]
}

export async function closeSurvey(surveyId: string) {
  const user = await requireAuth()
  const result = await db
    .update(survey)
    .set({ status: 'closed' })
    .where(and(eq(survey.id, surveyId), eq(survey.userId, user.id)))
    .returning()
  return result[0]
}

export async function getUserSurveys() {
  const user = await requireAuth()
  return db.query.survey.findMany({
    where: eq(survey.userId, user.id),
    orderBy: (s, { desc }) => desc(s.createdAt),
    with: {
      questions: { columns: { id: true } },
      responses: { columns: { id: true } },
    },
  })
}

export async function getSurveyDetail(surveyId: string) {
  const user = await requireAuth()
  return db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.userId, user.id)),
    with: {
      questions: { orderBy: (q, { asc }) => asc(q.order) },
      responses: { orderBy: (r, { desc }) => desc(r.createdAt) },
    },
  })
}

// ==================== Questions ====================

export type QuestionInput = {
  id?: string
  type: string
  title: string
  description?: string
  required: boolean
  options?: string[]
  order: number
}

export async function saveQuestions(surveyId: string, questionsInput: QuestionInput[]) {
  const user = await requireAuth()
  // Verify ownership
  const s = await db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.userId, user.id)),
  })
  if (!s) throw new Error('Survey not found')

  // Delete existing questions and re-insert (simple replace strategy)
  await db.delete(question).where(eq(question.surveyId, surveyId))

  if (questionsInput.length > 0) {
    await db.insert(question).values(
      questionsInput.map((q) => ({
        id: q.id || generateId(),
        surveyId,
        type: q.type,
        title: q.title,
        description: q.description || null,
        required: q.required,
        options: q.options || null,
        order: q.order,
      })),
    )
  }

  return { success: true }
}

// ==================== Public ====================

export async function getSurveyBySlug(slug: string) {
  return db.query.survey.findFirst({
    where: and(eq(survey.slug, slug), eq(survey.status, 'published')),
    with: {
      questions: { orderBy: (q, { asc }) => asc(q.order) },
    },
  })
}

export async function getSurveyForFill(surveyIdOrSlug: string) {
  return db.query.survey.findFirst({
    where: and(
      or(eq(survey.id, surveyIdOrSlug), eq(survey.slug, surveyIdOrSlug)),
      eq(survey.status, 'published'),
    ),
    with: {
      questions: { orderBy: (q, { asc }) => asc(q.order) },
    },
  })
}
