'use server'

import { eq, and, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { customQuestionType, question } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { AnswerJsonSchema } from '@/lib/question-runtime/types'

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

function generateId() {
  return crypto.randomUUID()
}

export async function getUserCustomTypes() {
  const user = await requireAuth()
  
  // Get types with usage count
  const types = await db
    .select({
      id: customQuestionType.id,
      name: customQuestionType.name,
      prompt: customQuestionType.prompt,
      createdAt: customQuestionType.createdAt,
      usageCount: sql<number>`count(${question.id})::int`,
    })
    .from(customQuestionType)
    .leftJoin(question, eq(customQuestionType.id, question.customTypeId))
    .where(eq(customQuestionType.userId, user.id))
    .groupBy(customQuestionType.id)
    .orderBy(sql`${customQuestionType.createdAt} DESC`)

  return types
}

export async function createCustomType(input: {
  name: string
  description?: string
  prompt: string
  formCode: string
  displayCode: string
  answerSchema: AnswerJsonSchema
}) {
  const user = await requireAuth()
  const id = generateId()
  await db.insert(customQuestionType).values({
    id,
    userId: user.id,
    name: input.name,
    description: input.description ?? null,
    prompt: input.prompt,
    formCode: input.formCode,
    displayCode: input.displayCode,
    answerSchema: input.answerSchema,
  })
  return { id }
}

export async function deleteCustomType(typeId: string) {
  const user = await requireAuth()
  await db
    .delete(customQuestionType)
    .where(and(eq(customQuestionType.id, typeId), eq(customQuestionType.userId, user.id)))
}

export async function getCustomTypeById(typeId: string) {
  const user = await requireAuth()
  return db.query.customQuestionType.findFirst({
    where: and(eq(customQuestionType.id, typeId), eq(customQuestionType.userId, user.id)),
  })
}
