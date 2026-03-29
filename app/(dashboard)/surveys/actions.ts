'use server'

import { eq, and, count, or, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { survey, question, response, customQuestionType } from '@/lib/db/auth-schema'
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

async function generateUniqueSlug() {
  while (true) {
    const slug = generateSlug()
    const existing = await db.query.survey.findFirst({
      where: eq(survey.slug, slug),
      columns: { id: true },
    })

    if (!existing) {
      return slug
    }
  }
}

function isChoiceQuestion(type: string) {
  return type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown'
}

function normalizeOptions(options: string[] | null | undefined) {
  if (!Array.isArray(options)) {
    return []
  }

  return options.map((option) => option.trim()).filter((option) => option.length > 0)
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
  data: { title?: string; description?: string },
) {
  const user = await requireAuth()
  // Exclude status from content updates — use publishSurvey/closeSurvey for lifecycle changes
  const { title, description } = data
  const result = await db
    .update(survey)
    .set({ title, description })
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
  const existing = await db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.userId, user.id)),
    columns: { id: true, slug: true },
    with: {
      questions: {
        columns: {
          id: true,
          type: true,
          options: true,
        },
      },
    },
  })
  if (!existing) throw new Error('Survey not found')

  if (existing.questions.length === 0) {
    throw new Error('Add at least one question before publishing')
  }

  for (const item of existing.questions) {
    if (item.type.startsWith('custom:')) continue
    if (!isChoiceQuestion(item.type)) {
      continue
    }

    const options = normalizeOptions(item.options)
    if (!Array.isArray(item.options) || options.length !== item.options.length || options.length === 0) {
      throw new Error('Choice questions must include at least one non-empty option before publishing')
    }
  }

  const slug = existing.slug ?? await generateUniqueSlug()

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

  // Atomically delete existing questions and re-insert
  await db.transaction(async (tx) => {
    const [{ value: responseCount }] = await tx
      .select({ value: count() })
      .from(response)
      .where(eq(response.surveyId, surveyId))

    if (responseCount > 0) {
      throw new Error('Cannot modify questions after responses have been collected')
    }

    await tx.delete(question).where(eq(question.surveyId, surveyId))
    if (questionsInput.length > 0) {
      // Build snapshot map for any custom type questions
      const customTypeIds = questionsInput
        .filter((q) => q.type.startsWith('custom:'))
        .map((q) => q.type.replace('custom:', ''))

      const customTypeRows = customTypeIds.length > 0
        ? await tx.select().from(customQuestionType).where(
            inArray(customQuestionType.id, customTypeIds)
          )
        : []

      const typeMap = new Map(customTypeRows.map((r) => [r.id, r]))

      await tx.insert(question).values(
        questionsInput.map((q) => {
          const customId = q.type.startsWith('custom:') ? q.type.replace('custom:', '') : null
          const customRow = customId ? typeMap.get(customId) : undefined
          return {
            id: q.id || generateId(),
            surveyId,
            type: q.type,
            title: q.title,
            description: q.description || null,
            required: q.required,
            options: q.options || null,
            order: q.order,
            customTypeId: customId ?? null,
            formCodeSnapshot: customRow?.formCode ?? null,
            displayCodeSnapshot: customRow?.displayCode ?? null,
          }
        }),
      )
    }
  })

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

// ==================== Response Detail ====================

export async function getResponseById(surveyId: string, responseId: string) {
  const user = await requireAuth()

  const surveyData = await db.query.survey.findFirst({
    where: and(eq(survey.id, surveyId), eq(survey.userId, user.id)),
    columns: { id: true, title: true },
    with: {
      questions: { orderBy: (q, { asc }) => asc(q.order) },
    },
  })

  if (!surveyData) return null

  const responseData = await db.query.response.findFirst({
    where: and(eq(response.id, responseId), eq(response.surveyId, surveyId)),
  })

  if (!responseData) return null

  // Fetch all IDs ordered by createdAt desc to compute prev/next
  const allIds = await db.query.response.findMany({
    where: eq(response.surveyId, surveyId),
    columns: { id: true },
    orderBy: (r, { desc }) => desc(r.createdAt),
  })

  const index = allIds.findIndex((r) => r.id === responseId)
  if (index === -1) return null
  const prevId = index > 0 ? allIds[index - 1].id : null
  const nextId = index < allIds.length - 1 ? allIds[index + 1].id : null

  return {
    response: responseData,
    survey: { title: surveyData.title },
    questions: surveyData.questions,
    prevId,
    nextId,
    responseIndex: index + 1,
  }
}
