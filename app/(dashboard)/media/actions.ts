'use server'

import { and, desc, eq, inArray, count as drizzleCount } from 'drizzle-orm'
import { db } from '@/lib/db'
import { mediaGeneration, mediaGenerationVariant } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  DEFAULT_POSTER_ASPECT_RATIO,
  POSTER_ASPECT_RATIO_OPTIONS,
  type MultimediaExperience,
  type PosterAspectRatio,
  type PosterVariant,
} from '@/lib/multimedia/types'

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
  variants: PosterVariant[]
  createdAt: Date
}

export type MediaHistoryPage = {
  items: MediaHistoryItem[]
  total: number
  pageSize: number
}

type MediaGenerationVariantRow = typeof mediaGenerationVariant.$inferSelect

function normalizeAspectRatio(value: string): PosterAspectRatio {
  if (POSTER_ASPECT_RATIO_OPTIONS.some((option) => option === value)) {
    return value as PosterAspectRatio
  }

  return DEFAULT_POSTER_ASPECT_RATIO
}

function isMissingVariantTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? (error as { cause?: unknown }).cause
      : undefined
  const causeCode =
    typeof cause === 'object' && cause !== null && 'code' in cause
      ? String((cause as { code?: unknown }).code).toUpperCase()
      : ''

  return (
    causeCode === '42P01' ||
    (message.includes('media_generation_variant') && message.includes('does not exist'))
  )
}

export async function getMediaRecord(id: string): Promise<MediaHistoryItem | null> {
  const user = await requireAuth()

  const [row] = await db
    .select()
    .from(mediaGeneration)
    .where(and(eq(mediaGeneration.id, id), eq(mediaGeneration.userId, user.id)))
    .limit(1)

  if (!row) return null

  let variants: MediaGenerationVariantRow[] = []
  try {
    variants = await db
      .select()
      .from(mediaGenerationVariant)
      .where(
        and(
          eq(mediaGenerationVariant.userId, user.id),
          eq(mediaGenerationVariant.parentId, id),
        ),
      )
      .orderBy(desc(mediaGenerationVariant.createdAt))
  } catch (error) {
    if (!isMissingVariantTableError(error)) throw error
  }

  return {
    id: row.id,
    brief: row.brief,
    result: row.result as MultimediaExperience,
    variants: variants.map((v) => ({
      id: v.id,
      parentId: v.parentId,
      imageDataUrl: v.imageDataUrl,
      prompt: v.posterPrompt,
      aspectRatio: normalizeAspectRatio(v.aspectRatio),
      createdAt: v.createdAt.toISOString(),
    })),
    createdAt: row.createdAt,
  }
}

export async function getMediaHistory(page = 1): Promise<MediaHistoryPage> {
  const user = await requireAuth()
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const offset = (safePage - 1) * PAGE_SIZE

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

  const parentIds = items.map((item) => item.id)
  let variants: MediaGenerationVariantRow[] = []

  if (parentIds.length > 0) {
    try {
      variants = await db
        .select()
        .from(mediaGenerationVariant)
        .where(
          and(
            eq(mediaGenerationVariant.userId, user.id),
            inArray(mediaGenerationVariant.parentId, parentIds),
          ),
        )
        .orderBy(desc(mediaGenerationVariant.createdAt))
    } catch (error) {
      if (!isMissingVariantTableError(error)) {
        throw error
      }

      console.warn(
        '[media/actions] media_generation_variant table is unavailable. Run "npx drizzle-kit push" to sync schema.',
      )
    }
  }

  const variantsByParent = new Map<string, PosterVariant[]>()
  for (const variant of variants) {
    const existing = variantsByParent.get(variant.parentId) ?? []
    existing.push({
      id: variant.id,
      parentId: variant.parentId,
      imageDataUrl: variant.imageDataUrl,
      prompt: variant.posterPrompt,
      aspectRatio: normalizeAspectRatio(variant.aspectRatio),
      createdAt: variant.createdAt.toISOString(),
    })
    variantsByParent.set(variant.parentId, existing)
  }

  return {
    items: items.map((row) => ({
      id: row.id,
      brief: row.brief,
      result: row.result as MultimediaExperience,
      variants: variantsByParent.get(row.id) ?? [],
      createdAt: row.createdAt,
    })),
    total: totalResult.count,
    pageSize: PAGE_SIZE,
  }
}
