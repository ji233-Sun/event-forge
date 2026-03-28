'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SlidePreview, type SlidePreviewHandle } from '@/components/slide-preview'
import { ThumbnailStrip } from '@/components/slide-studio/thumbnail-strip'
import { EditPanel } from '@/components/slide-studio/edit-panel'
import { parseSlides, getSlideTitle } from '@/lib/slides'
import {
  saveDeck,
  updateDeckMarkdown,
  deleteDeck,
  renderMarkdown,
} from './actions'
import type { DeckSummary } from './actions'
import {
  IconSparkles,
  IconLoader2,
  IconDice,
  IconArrowLeft,
  IconPresentation,
  IconTrash,
  IconClock,
} from '@tabler/icons-react'

type Phase = 'input' | 'generating' | 'studio'

interface SlideSession {
  markdown: string
  html: string
  css: string
}

const samplePrompts = [
  'A campus country music festival for 200 attendees with sponsor booths, handmade market stalls, and food pop-ups.',
  'A university esports league across five campuses with 500 expected spectators and a need for hardware sponsorships.',
  'A student startup demo day with 100 teams, investor judges, and a pitch deck tailored for corporate partners.',
  'A campus charity marathon with 1,000 runners looking for wellness brands, hydration partners, and volunteer support.',
  'An international culture festival showcasing 20 countries with 800 attendees and diverse brand collaboration opportunities.',
  'A university technology expo focused on AI and robotics, targeting 300 attendees and outreach to tech sponsors.',
  'A graduation photography exhibition featuring four years of student memories and sponsorship outreach to camera brands.',
  'A zero-waste campus market for 400 participants featuring secondhand exchange, eco workshops, and green brand partnerships.',
]

export function SlidesPageClient({ initialDecks }: { initialDecks: DeckSummary[] }) {
  const [phase, setPhase] = useState<Phase>('input')
  const [prompt, setPrompt] = useState('')
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [session, setSession] = useState<SlideSession | null>(null)
  const [deckId, setDeckId] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const currentSlideIndexRef = useRef(currentSlideIndex)
  useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex
  }, [currentSlideIndex])

  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [decks, setDecks] = useState(initialDecks)
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null)

  const previewRef = useRef<SlidePreviewHandle>(null)

  // ── Generate ──────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerateError(null)
    setPhase('generating')

    try {
      const res = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        let message = 'Generation failed'
        try { const err = await res.json(); message = err.error || message } catch { /* */ }
        throw new Error(message)
      }

      const data = (await res.json()) as { html?: string; css?: string; markdown?: string }
      if (!data.html || !data.css || !data.markdown) throw new Error('Invalid response')

      const title = getSlideTitle(parseSlides(data.markdown)[0], 'Untitled Deck')
      const saved = await saveDeck({ title, prompt: prompt.trim(), markdown: data.markdown })

      setDeckId(saved.id)
      setDecks((prev) => [{ id: saved.id, title, prompt: prompt.trim(), createdAt: new Date() }, ...prev])
      setSession({ html: data.html, css: data.css, markdown: data.markdown })
      setCurrentSlideIndex(0)
      setPhase('studio')
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Something went wrong')
      setPhase('input')
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────
  const handleEdit = useCallback(
    async (instruction: string, scope: 'current' | 'all') => {
      if (!session) return
      setEditLoading(true)
      setEditError(null)

      try {
        const res = await fetch('/api/edit-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            markdown: session.markdown,
            instruction,
            scope,
            currentSlideIndex: currentSlideIndexRef.current,
          }),
        })

        if (!res.ok) {
          let message = 'Edit failed'
          try { const err = await res.json(); message = err.error || message } catch { /* */ }
          throw new Error(message)
        }

        const data = (await res.json()) as { html?: string; css?: string; markdown?: string }
        if (!data.html || !data.css || !data.markdown) throw new Error('Invalid response')

        if (deckId) await updateDeckMarkdown(deckId, data.markdown)

        const newSlideCount = parseSlides(data.markdown).length
        const nextIndex = currentSlideIndexRef.current < newSlideCount
          ? currentSlideIndexRef.current
          : newSlideCount - 1

        setSession({ html: data.html, css: data.css, markdown: data.markdown })
        setCurrentSlideIndex(nextIndex)
      } catch (e) {
        setEditError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setEditLoading(false)
      }
    },
    [session, deckId],
  )

  // ── Load from history ─────────────────────────────────────────────────
  async function handleLoadDeck(id: string) {
    setLoadingDeckId(id)
    try {
      const { getDeck } = await import('./actions')
      const d = await getDeck(id)
      const { html, css } = await renderMarkdown(d.markdown)
      setDeckId(d.id)
      setSession({ html, css, markdown: d.markdown })
      setCurrentSlideIndex(0)
      setPhase('studio')
    } catch (e) {
      console.error('Failed to load deck:', e)
    } finally {
      setLoadingDeckId(null)
    }
  }

  // ── Delete deck ───────────────────────────────────────────────────────
  async function handleDeleteDeck(id: string) {
    try {
      await deleteDeck(id)
      setDecks((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      console.error('Failed to delete deck:', e)
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────
  const slides = session ? parseSlides(session.markdown) : []
  const titles = slides.map((seg, i) => getSlideTitle(seg, `Slide ${i + 1}`))

  // ── Render: Generating ────────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col items-center justify-center gap-4">
        <IconLoader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-lg font-medium">Crafting your slides...</p>
        <p className="text-sm text-muted-foreground">This usually takes 15-30 seconds</p>
      </div>
    )
  }

  // ── Render: Studio ────────────────────────────────────────────────────
  if (phase === 'studio') {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPhase('input')
              setSession(null)
              setDeckId(null)
              setCurrentSlideIndex(0)
              setEditError(null)
            }}
          >
            <IconArrowLeft className="mr-1 size-4" />
            Back
          </Button>
          <h1 className="text-sm font-semibold">Slide Studio</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{slides.length} slides</span>
            <Button variant="outline" size="sm" onClick={() => previewRef.current?.present()}>
              <IconPresentation className="mr-1 size-4" />
              Present
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-40 shrink-0 overflow-y-auto border-r">
            <ThumbnailStrip
              slides={slides}
              activeIndex={currentSlideIndex}
              onSelect={(i) => setCurrentSlideIndex(i)}
              titles={titles}
            />
          </aside>
          <main className="flex-1 overflow-hidden bg-black">
            {session && (
              <SlidePreview
                ref={previewRef}
                html={session.html}
                css={session.css}
                currentSlide={currentSlideIndex}
                onSlideChange={setCurrentSlideIndex}
              />
            )}
          </main>
          <aside className="w-80 shrink-0 overflow-y-auto border-l">
            <EditPanel
              currentSlideNumber={currentSlideIndex + 1}
              onEdit={handleEdit}
              isLoading={editLoading}
              error={editError}
            />
          </aside>
        </div>
      </div>
    )
  }

  // ── Render: Input (default) ──────────────────────────────────────────
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Slide Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe your event and get an AI-generated sponsorship pitch deck
          </p>
        </div>

        {/* Error */}
        {generateError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {generateError}
          </div>
        )}

        {/* Input form */}
        <div className="space-y-4">
          <textarea
            className="h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Describe your event... e.g., 'A cyberpunk-themed campus music festival for 200 people, need sponsorship, ticket sales, and band voting'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={!prompt.trim()}>
              <IconSparkles className="mr-1 size-4" />
              Generate Pitch Deck
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrompt(samplePrompts[Math.floor(Math.random() * samplePrompts.length)])}
            >
              <IconDice className="mr-1 size-4" />
              Random Prompt
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <IconClock size={18} className="text-muted-foreground" />
            Recent Decks
          </h2>

          {decks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No slide decks yet. Create your first one above.
            </p>
          ) : (
            <div className="space-y-2">
              {decks.map((d) => (
                <Card key={d.id} className="border-border/50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      <IconPresentation size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d.createdAt))}
                        {' · '}
                        {d.prompt.slice(0, 60)}{d.prompt.length > 60 ? '...' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadDeck(d.id)}
                        disabled={loadingDeckId === d.id}
                      >
                        {loadingDeckId === d.id ? (
                          <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                          'Open'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteDeck(d.id)}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
