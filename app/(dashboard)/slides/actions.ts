'use server'

import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { deck } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { proxyUrlToR2Key, r2DeleteMany } from '@/lib/r2'
import type { TemplateValues } from '@/lib/slides/template/config'

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type SlideMode = 'marp' | 'image'

export type ImageSlide = {
  index: number
  title: string
  imagePrompt: string
  url?: string
}

export type DeckSummary = {
  id: string
  title: string
  prompt: string
  mode: SlideMode
  createdAt: Date
}

export type DeckFull = DeckSummary & {
  markdown: string | null
  images: ImageSlide[] | null
  templateValues: TemplateValues | null
  updatedAt: Date
}

export async function getUserDecks(): Promise<DeckSummary[]> {
  const user = await requireAuth()
  const rows = await db
    .select({
      id: deck.id,
      title: deck.title,
      prompt: deck.prompt,
      mode: deck.mode,
      createdAt: deck.createdAt,
    })
    .from(deck)
    .where(eq(deck.userId, user.id))
    .orderBy(desc(deck.createdAt))
  return rows.map((r) => ({ ...r, mode: (r.mode ?? 'marp') as SlideMode }))
}

export async function getDeck(deckId: string): Promise<DeckFull> {
  const user = await requireAuth()
  const [row] = await db
    .select()
    .from(deck)
    .where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')
  return {
    ...row,
    mode: (row.mode ?? 'marp') as SlideMode,
    images: row.images ?? null,
    templateValues: (row.templateValues as TemplateValues | null) ?? null,
  }
}

export async function saveDeck(opts: {
  title: string
  prompt: string
  mode: SlideMode
  markdown?: string
  images?: ImageSlide[]
  templateValues?: TemplateValues
}): Promise<{ id: string }> {
  const user = await requireAuth()
  const id = crypto.randomUUID()
  await db.insert(deck).values({
    id,
    title: opts.title,
    prompt: opts.prompt,
    mode: opts.mode,
    markdown: opts.markdown ?? null,
    images: opts.images ?? null,
    templateValues: opts.templateValues ?? null,
    userId: user.id,
  })
  return { id }
}

export async function updateDeckImages(deckId: string, images: ImageSlide[]): Promise<void> {
  const user = await requireAuth()
  const [row] = await db.select({ userId: deck.userId }).from(deck).where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')
  await db.update(deck).set({ images, updatedAt: new Date() }).where(eq(deck.id, deckId))
}

export async function updateDeckMarkdown(deckId: string, markdown: string): Promise<void> {
  const user = await requireAuth()
  const [row] = await db.select({ userId: deck.userId }).from(deck).where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')
  await db.update(deck).set({ markdown, updatedAt: new Date() }).where(eq(deck.id, deckId))
}

export async function deleteDeck(deckId: string): Promise<void> {
  const user = await requireAuth()
  const [row] = await db
    .select({ userId: deck.userId, images: deck.images })
    .from(deck)
    .where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')

  // Clean up R2 objects for image-mode decks
  if (row.images && row.images.length > 0) {
    const keys = row.images
      .filter((img) => !!img.url)
      .map((img) => proxyUrlToR2Key(img.url!))
      .filter((k): k is string => k !== null)
    await r2DeleteMany(keys)
  }

  await db.delete(deck).where(eq(deck.id, deckId))
}
