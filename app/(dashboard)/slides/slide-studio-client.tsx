'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SlidePreview, type SlidePreviewHandle } from '@/components/slide-preview'
import { ThumbnailStrip } from '@/components/slide-studio/thumbnail-strip'
import { EditPanel } from '@/components/slide-studio/edit-panel'
import { StylePanel } from '@/components/slide-studio/style-panel'
import { parseSlides, getSlideTitle } from '@/lib/slides'
import {
  saveDeck,
  updateDeckMarkdown,
  updateDeckImages,
  deleteDeck,
  getDeck,
  renderMarkdown,
} from './actions'
import type { DeckSummary, SlideMode, ImageSlide } from './actions'
import { ImageGeneratingScreen } from '@/components/slide-studio/image-generating-screen'
import { ImageStudioView } from '@/components/slide-studio/image-studio-view'
import { StylePickerScreen } from '@/components/slide-studio/style-picker-screen'
import type { ImageSlideState } from '@/components/slide-studio/image-types'
import {
  createInitialTemplateStoreState,
  getTemplateValues,
  setTemplateValue,
  shuffleTemplateState,
  toggleTemplateLock,
  type TemplateStoreState,
} from '@/lib/slides/template/store'
import { TEMPLATE_KEYS, type TemplateKey, type TemplateValues } from '@/lib/slides/template/config'
import {
  IconSparkles,
  IconLoader2,
  IconDice,
  IconArrowLeft,
  IconPresentation,
  IconTrash,
  IconClock,
} from '@tabler/icons-react'

type Phase = 'input' | 'style-pick' | 'generating' | 'studio' | 'image-generating' | 'image-studio'

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

  const [templateState, setTemplateState] = useState<TemplateStoreState>(
    () => createInitialTemplateStoreState()
  )
  const [activeTab, setActiveTab] = useState<'edit' | 'style'>('edit')
  const [isRestyling, setIsRestyling] = useState(false)
  const [restyleError, setRestyleError] = useState<string | null>(null)

  const [decks, setDecks] = useState(initialDecks)
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null)

  const [slideMode, setSlideMode] = useState<SlideMode>('marp')
  const [imageSlideStates, setImageSlideStates] = useState<ImageSlideState[]>([])
  const [imageGenerateError, setImageGenerateError] = useState<string | null>(null)
  const [imageDeckTitle, setImageDeckTitle] = useState<string>('Slide Deck')

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
        body: JSON.stringify({ prompt, templateValues: getTemplateValues(templateState) }),
      })

      if (!res.ok) {
        let message = 'Generation failed'
        try { const err = await res.json(); message = err.error || message } catch { /* */ }
        throw new Error(message)
      }

      const data = (await res.json()) as { html?: string; css?: string; markdown?: string }
      if (!data.html || !data.css || !data.markdown) throw new Error('Invalid response')

      const title = getSlideTitle(parseSlides(data.markdown)[0], 'Untitled Deck')
      const saved = await saveDeck({
        title,
        prompt: prompt.trim(),
        mode: 'marp',
        markdown: data.markdown,
        templateValues: getTemplateValues(templateState),
      })

      setDeckId(saved.id)
      setDecks((prev) => [{ id: saved.id, title, prompt: prompt.trim(), mode: 'marp', createdAt: new Date() }, ...prev])
      setSession({ html: data.html, css: data.css, markdown: data.markdown })
      setCurrentSlideIndex(0)
      setPhase('studio')
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Something went wrong')
      setPhase('input')
    }
  }

  // ── Generate Images ───────────────────────────────────────────────────
  async function handleGenerateImages() {
    if (!prompt.trim()) return
    setImageGenerateError(null)
    setImageSlideStates([])
    setPhase('image-generating')

    // Phase 1: get slide plan
    let planSlides: Array<{ index: number; title: string; imagePrompt: string }>
    try {
      const res = await fetch('/api/generate-slide-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        let message = 'Slide planning failed'
        try { const err = await res.json() as { error?: string }; message = err.error || message } catch { /* */ }
        throw new Error(message)
      }
      const data = await res.json() as { slides: typeof planSlides }
      if (!Array.isArray(data.slides) || data.slides.length === 0) {
        throw new Error('Invalid slide plan: expected a non-empty slides array')
      }
      planSlides = data.slides
    } catch (e) {
      setImageGenerateError(e instanceof Error ? e.message : 'Something went wrong')
      setPhase('input')
      return
    }

    // Initialize slide states as 'pending'
    const initialStates: ImageSlideState[] = planSlides.map((s) => ({
      ...s,
      status: 'pending',
    }))
    setImageSlideStates(initialStates)

    // Phase 2: sequential image generation (one at a time)
    const results: ImageSlideState[] = []
    for (const s of planSlides) {
      setImageSlideStates((prev) =>
        prev.map((st) => (st.index === s.index ? { ...st, status: 'generating' as const } : st)),
      )
      try {
        const res = await fetch('/api/generate-slide-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagePrompt: s.imagePrompt, slideIndex: s.index }),
        })
        if (!res.ok) throw new Error('Image generation failed')
        const img = await res.json() as { index: number; url: string }
        const done: ImageSlideState = { ...s, status: 'done', url: img.url }
        setImageSlideStates((prev) =>
          prev.map((st) => (st.index === s.index ? done : st)),
        )
        results.push(done)
      } catch {
        const failed: ImageSlideState = { ...s, status: 'failed' }
        setImageSlideStates((prev) =>
          prev.map((st) => (st.index === s.index ? failed : st)),
        )
        results.push(failed)
      }
    }

    const hasAnySuccess = results.some((r) => r.status === 'done')
    if (!hasAnySuccess) {
      setImageGenerateError('All image generations failed. Please try again.')
      setPhase('input')
      return
    }

    // Save all slides to DB (including failed ones — url omitted for failures so retries persist)
    const allSlides: ImageSlide[] = results.map((r) => ({
      index: r.index,
      title: r.title,
      imagePrompt: r.imagePrompt,
      ...(r.status === 'done' && r.url ? { url: r.url } : {}),
    }))

    const title = planSlides[0]?.title ?? 'Untitled Image Deck'
    setImageDeckTitle(title)
    try {
      const saved = await saveDeck({ title, prompt: prompt.trim(), mode: 'image', images: allSlides })
      setDeckId(saved.id)
      setDecks((prev) => [
        { id: saved.id, title, prompt: prompt.trim(), mode: 'image', createdAt: new Date() },
        ...prev,
      ])
    } catch {
      setImageGenerateError('Failed to save deck. Your images were generated but could not be saved.')
      setPhase('input')
      return
    }
    setPhase('image-studio')
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

  const handleTemplateValueChange = useCallback(
    <K extends TemplateKey>(key: K, value: TemplateValues[K]) => {
      setTemplateState((prev) => setTemplateValue(prev, key, value))
    },
    []
  )

  const handleToggleLock = useCallback((key: TemplateKey) => {
    setTemplateState((prev) => toggleTemplateLock(prev, key))
  }, [])

  const handlePreGenShuffle = useCallback(() => {
    setTemplateState((prev) => shuffleTemplateState(prev))
  }, [])

  // Shared restyle helper: replaces CSS + ECharts colors, updates session + DB
  const handleRestyle = useCallback(async (prevValues: TemplateValues, newValues: TemplateValues) => {
    if (!session) return
    setIsRestyling(true)
    setRestyleError(null)
    try {
      const res = await fetch('/api/restyle-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: session.markdown,
          prevTemplateValues: prevValues,
          templateValues: newValues,
        }),
      })
      if (!res.ok) {
        let message = 'Restyle failed'
        try { const err = (await res.json()) as { error?: string }; message = err.error ?? message } catch { /* */ }
        throw new Error(message)
      }
      const data = (await res.json()) as { html?: string; css?: string; markdown?: string }
      if (!data.html || !data.css || !data.markdown) throw new Error('Invalid response')
      if (deckId) await updateDeckMarkdown(deckId, data.markdown)
      setSession({ html: data.html, css: data.css, markdown: data.markdown })
    } catch (e) {
      setRestyleError(e instanceof Error ? e.message : 'Restyle failed')
    } finally {
      setIsRestyling(false)
    }
  }, [session, deckId])

  const handleShuffle = useCallback(() => {
    const prevValues = getTemplateValues(templateState)
    const newState = shuffleTemplateState(templateState)
    setTemplateState(newState)
    void handleRestyle(prevValues, getTemplateValues(newState))
  }, [templateState, handleRestyle])

  // Apply a decoded preset in Studio: restyle with ECharts color replacement
  const handleStudioPresetApply = useCallback((newValues: TemplateValues) => {
    const prevValues = getTemplateValues(templateState)
    setTemplateState((prev) => {
      return Object.fromEntries(
        TEMPLATE_KEYS.map((key) => [key, { ...prev[key], value: newValues[key] }])
      ) as TemplateStoreState
    })
    void handleRestyle(prevValues, newValues)
  }, [templateState, handleRestyle])

  // Apply a decoded preset in style-pick phase: no API call, preview auto-updates
  const handlePreGenPresetApply = useCallback((newValues: TemplateValues) => {
    setTemplateState((prev) => {
      return Object.fromEntries(
        TEMPLATE_KEYS.map((key) => [key, { ...prev[key], value: newValues[key] }])
      ) as TemplateStoreState
    })
  }, [])

  // ── Retry single image slide ──────────────────────────────────────────
  async function handleRetrySlide(index: number) {
    const slideState = imageSlideStates.find((s) => s.index === index)
    if (!slideState) return
    setImageSlideStates((prev) =>
      prev.map((s) => (s.index === index ? { ...s, status: 'generating' as const, url: undefined } : s))
    )
    try {
      const res = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt: slideState.imagePrompt, slideIndex: index }),
      })
      if (!res.ok) throw new Error('Image generation failed')
      const img = await res.json() as { index: number; url: string }
      setImageSlideStates((prev) => {
        const next = prev.map((s) =>
          s.index === index ? { ...s, status: 'done' as const, url: img.url } : s
        )
        if (deckId) {
          const persisted: ImageSlide[] = next.map((s) => ({
            index: s.index,
            title: s.title,
            imagePrompt: s.imagePrompt,
            ...(s.status === 'done' && s.url ? { url: s.url } : {}),
          }))
          void updateDeckImages(deckId, persisted)
        }
        return next
      })
    } catch {
      setImageSlideStates((prev) =>
        prev.map((s) => (s.index === index ? { ...s, status: 'failed' as const } : s))
      )
    }
  }

  // ── Load from history ─────────────────────────────────────────────────
  async function handleLoadDeck(id: string) {
    setLoadingDeckId(id)
    setGenerateError(null)
    setImageGenerateError(null)
    try {
      const d = await getDeck(id)

      // Restore template state if persisted
      if (d.templateValues) {
        setTemplateState((prev) => {
          const tv = d.templateValues!
          return Object.fromEntries(
            TEMPLATE_KEYS.map((key) => [key, { ...prev[key], value: tv[key] }])
          ) as TemplateStoreState
        })
      }

      if (d.mode === 'image') {
        const loaded: ImageSlideState[] = (d.images ?? []).map((img) => ({
          ...img,
          status: img.url ? ('done' as const) : ('failed' as const),
        }))
        setImageSlideStates(loaded)
        setImageDeckTitle(d.title)
        setDeckId(d.id)
        setPhase('image-studio')
      } else {
        const { html, css } = await renderMarkdown(d.markdown ?? '')
        setDeckId(d.id)
        setSession({ html, css, markdown: d.markdown ?? '' })
        setCurrentSlideIndex(0)
        setPhase('studio')
      }
    } catch (e) {
      console.error('Failed to load deck:', e)
      setGenerateError(e instanceof Error ? e.message : 'Failed to load deck')
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

  // ── Render: Style Pick ────────────────────────────────────────────────
  if (phase === 'style-pick') {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
        <StylePickerScreen
          prompt={prompt}
          templateState={templateState}
          onValueChange={handleTemplateValueChange}
          onToggleLock={handleToggleLock}
          onShuffle={handlePreGenShuffle}
          onPresetApply={handlePreGenPresetApply}
          onBack={() => setPhase('input')}
          onGenerate={handleGenerate}
        />
      </div>
    )
  }

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

  // ── Render: Image Generating ──────────────────────────────────────────
  if (phase === 'image-generating') {
    return (
      <ImageGeneratingScreen
        totalSlides={imageSlideStates.length}
        slideStatuses={imageSlideStates.map((s) => s.status)}
      />
    )
  }

  // ── Render: Image Studio ──────────────────────────────────────────────
  if (phase === 'image-studio') {
    return (
      <ImageStudioView
        slides={imageSlideStates}
        deckId={deckId ?? undefined}
        deckTitle={imageDeckTitle}
        onBack={() => {
          setPhase('input')
          setImageSlideStates([])
          setDeckId(null)
          setImageGenerateError(null)
        }}
        onRetry={handleRetrySlide}
      />
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
          <aside className="w-80 shrink-0 overflow-y-auto border-l flex flex-col">
            {/* Tab bar */}
            <div className="flex shrink-0 border-b">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={[
                  'flex-1 px-3 py-2.5 text-xs font-medium transition-colors',
                  activeTab === 'edit'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={[
                  'flex-1 px-3 py-2.5 text-xs font-medium transition-colors',
                  activeTab === 'style'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                Style
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'edit' ? (
                <EditPanel
                  currentSlideNumber={currentSlideIndex + 1}
                  onEdit={handleEdit}
                  isLoading={editLoading}
                  error={editError}
                />
              ) : (
                <StylePanel
                  state={templateState}
                  isLoading={isRestyling}
                  error={restyleError}
                  onValueChange={handleTemplateValueChange}
                  onToggleLock={handleToggleLock}
                  onShuffle={handleShuffle}
                  onPresetApply={handleStudioPresetApply}
                />
              )}
            </div>
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
        {imageGenerateError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {imageGenerateError}
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={slideMode === 'marp' ? () => setPhase('style-pick') : handleGenerateImages}
              disabled={!prompt.trim()}
            >
              <IconSparkles className="mr-1 size-4" />
              {slideMode === 'marp' ? 'Generate Pitch Deck' : 'Generate Image Deck'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPrompt(samplePrompts[Math.floor(Math.random() * samplePrompts.length)])}
            >
              <IconDice className="mr-1 size-4" />
              Random Prompt
            </Button>
            <div className="ml-auto flex overflow-hidden rounded-md border text-xs">
              <button
                type="button"
                onClick={() => setSlideMode('marp')}
                className={[
                  'px-3 py-1.5 font-medium transition-colors',
                  slideMode === 'marp'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-muted',
                ].join(' ')}
              >
                Marp
              </button>
              <button
                type="button"
                onClick={() => setSlideMode('image')}
                className={[
                  'px-3 py-1.5 font-medium transition-colors',
                  slideMode === 'image'
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-muted',
                ].join(' ')}
              >
                Image
              </button>
            </div>
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
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                          {d.mode === 'image' ? 'Image' : 'Marp'}
                        </span>
                      </div>
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
