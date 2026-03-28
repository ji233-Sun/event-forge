'use server'

import { desc, eq, count as drizzleCount } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mediaGeneration } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { MultimediaExperience } from '@/lib/multimedia/types'

const PAGE_SIZE = 10

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type MediaHistoryItem = {
  id: string
  brief: string
  result: MultimediaExperience
  createdAt: Date
}

export type MediaHistoryPage = {
  items: MediaHistoryItem[]
  total: number
  pageSize: number
}

export async function getMediaHistory(page = 1): Promise<MediaHistoryPage> {
  const user = await requireAuth()
  const offset = (page - 1) * PAGE_SIZE

  const [items, [totalResult]] = await Promise.all([
    db
      .select()
      .from(mediaGeneration)
      .where(eq(mediaGeneration.userId, user.id))
      .orderBy(desc(mediaGeneration.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: drizzleCount() })
      .from(mediaGeneration)
      .where(eq(mediaGeneration.userId, user.id)),
  ])

  return {
    items: items.map((row) => ({
      id: row.id,
      brief: row.brief,
      result: row.result as MultimediaExperience,
      createdAt: row.createdAt,
    })),
    total: totalResult.count,
    pageSize: PAGE_SIZE,
  }
}
