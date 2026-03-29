'use server'

import { eq, and, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { minitool, minitoolParticipant } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function getUserMinitools() {
  const user = await requireAuth()
  return db
    .select({
      id: minitool.id,
      name: minitool.name,
      isPublic: minitool.isPublic,
      createdAt: minitool.createdAt,
      participantCount: sql<number>`count(distinct ${minitoolParticipant.visitorId})::int`,
    })
    .from(minitool)
    .leftJoin(minitoolParticipant, eq(minitool.id, minitoolParticipant.minitoolId))
    .where(eq(minitool.userId, user.id))
    .groupBy(minitool.id)
    .orderBy(sql`${minitool.createdAt} DESC`)
}

export async function createMinitool(input: {
  name: string
  prompt: string
  componentCode: string
  hostCode: string
}) {
  const user = await requireAuth()
  const id = crypto.randomUUID()
  await db.insert(minitool).values({
    id,
    userId: user.id,
    name: input.name,
    prompt: input.prompt,
    componentCode: input.componentCode,
    hostCode: input.hostCode,
    isPublic: false,
  })
  return { id }
}

export async function deleteMinitool(minitoolId: string) {
  const user = await requireAuth()
  await db.delete(minitool).where(
    and(eq(minitool.id, minitoolId), eq(minitool.userId, user.id)),
  )
}

export async function toggleMinitoolPublic(minitoolId: string, isPublic: boolean) {
  const user = await requireAuth()
  await db
    .update(minitool)
    .set({ isPublic })
    .where(and(eq(minitool.id, minitoolId), eq(minitool.userId, user.id)))
}

export async function getMinitoolById(minitoolId: string) {
  const user = await requireAuth()
  return db.query.minitool.findFirst({
    where: and(eq(minitool.id, minitoolId), eq(minitool.userId, user.id)),
  })
}

export async function getMinitoolParticipants(minitoolId: string) {
  const user = await requireAuth()
  const tool = await db.query.minitool.findFirst({
    where: and(eq(minitool.id, minitoolId), eq(minitool.userId, user.id)),
    columns: { id: true },
  })
  if (!tool) throw new Error('Not found')
  return db.query.minitoolParticipant.findMany({
    where: eq(minitoolParticipant.minitoolId, minitoolId),
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  })
}
