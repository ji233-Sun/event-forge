'use server'

import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { deck } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type DeckSummary = {
  id: string
  title: string
  prompt: string
  createdAt: Date
}

export type DeckFull = DeckSummary & {
  markdown: string
  updatedAt: Date
}

export async function getUserDecks(): Promise<DeckSummary[]> {
  const user = await requireAuth()
  const rows = await db
    .select({ id: deck.id, title: deck.title, prompt: deck.prompt, createdAt: deck.createdAt })
    .from(deck)
    .where(eq(deck.userId, user.id))
    .orderBy(desc(deck.createdAt))
  return rows
}

export async function getDeck(deckId: string): Promise<DeckFull> {
  const user = await requireAuth()
  const [row] = await db
    .select()
    .from(deck)
    .where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')
  return row
}

export async function saveDeck(opts: { title: string; prompt: string; markdown: string }): Promise<{ id: string }> {
  const user = await requireAuth()
  const id = crypto.randomUUID()
  await db.insert(deck).values({
    id,
    title: opts.title,
    prompt: opts.prompt,
    markdown: opts.markdown,
    userId: user.id,
  })
  return { id }
}

export async function updateDeckMarkdown(deckId: string, markdown: string): Promise<void> {
  const user = await requireAuth()
  const [row] = await db.select({ userId: deck.userId }).from(deck).where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')
  await db.update(deck).set({ markdown, updatedAt: new Date() }).where(eq(deck.id, deckId))
}

export async function deleteDeck(deckId: string): Promise<void> {
  const user = await requireAuth()
  const [row] = await db.select({ userId: deck.userId }).from(deck).where(eq(deck.id, deckId))
  if (!row || row.userId !== user.id) throw new Error('Deck not found')
  await db.delete(deck).where(eq(deck.id, deckId))
}

export async function renderMarkdown(markdownInput: string): Promise<{ html: string; css: string }> {
  await requireAuth()
  const Marp = (await import('@marp-team/marp-core')).default
  const marp = new Marp({ html: true })
  const { html, css } = marp.render(markdownInput)
  return { html, css }
}
