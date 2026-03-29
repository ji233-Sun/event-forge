'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  IconSparkles,
  IconHistory,
  IconArrowRight,
  IconLoader2,
  IconPhoto,
  IconMusic,
  IconMessageCircle,
  IconChevronLeft,
  IconChevronRight,
  IconDice,
} from '@tabler/icons-react'

import { MultimediaResult } from '@/components/multimedia/multimedia-result'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DEFAULT_POSTER_ASPECT_RATIO,
  type MultimediaExperience,
  type PosterAspectRatio,
} from '@/lib/multimedia/types'
import { getMediaHistory, type MediaHistoryItem, type MediaHistoryPage } from './actions'

// ─── Constants ───────────────────────────────────────────────────────────────

const EXAMPLE_BRIEFS = [
  'Next Friday we are hosting a cyberpunk campus music festival for 200 guests with neon visuals, a DJ warm-up set, and a sponsor-friendly promo push.',
  'Create launch media for a rooftop startup demo night with a polished, futuristic city-light aesthetic and a high-energy social caption.',
  'Build a warm summer street food night campaign with vibrant poster art, chill electronic music, and a playful community-first social teaser.',
]

const LOADING_MESSAGES = [
  { icon: IconPhoto, text: 'Crafting your poster...' },
  { icon: IconMusic, text: 'Preparing soundtrack controls...' },
  { icon: IconMessageCircle, text: 'Writing social copy...' },
  { icon: IconSparkles, text: 'Polishing the final kit...' },
]

const POSTER_RATIO_OPTIONS: Array<{ value: PosterAspectRatio; label: string }> = [
  { value: '16:9', label: '16:9 Landscape' },
  { value: '4:5', label: '4:5 Portrait' },
  { value: '1:1', label: '1:1 Square' },
  { value: '9:16', label: '9:16 Story' },
]

const UI_LABEL_CLASS = 'text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'

type Phase = 'input' | 'loading' | 'result'

type MultimediaApiResponse =
  | { data: MultimediaExperience; id: string | null }
  | { error: string }

// ─── Generate Tab ────────────────────────────────────────────────────────────

function GenerateTab() {
  const [phase, setPhase] = useState<Phase>('input')
  const [brief, setBrief] = useState(EXAMPLE_BRIEFS[0])
  const [posterAspectRatio, setPosterAspectRatio] = useState<PosterAspectRatio>(DEFAULT_POSTER_ASPECT_RATIO)
  const [error, setError] = useState('')
  const [result, setResult] = useState<MultimediaExperience | null>(null)
  const [resultRecordId, setResultRecordId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  const requestIdRef = useRef(0)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current)
      if (loadingIntervalRef.current !== null) clearInterval(loadingIntervalRef.current)
    }
  }, [])

  function startLoadingAnimation() {
    setLoadingStep(0)
    loadingIntervalRef.current = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000)
  }

  function stopLoadingAnimation() {
    if (loadingIntervalRef.current !== null) {
      clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedBrief = brief.trim()
    if (!normalizedBrief) {
      setError('Please describe the event before generating multimedia assets.')
      return
    }

    setCopied(false)
    setError('')
    setResult(null)
    setResultRecordId(null)
    setPhase('loading')
    startLoadingAnimation()

    const requestId = ++requestIdRef.current

    try {
      const response = await fetch('/api/multimedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: normalizedBrief,
          aspectRatio: posterAspectRatio,
        }),
      })

      const payload = (await response.json()) as MultimediaApiResponse

      if (requestId !== requestIdRef.current) return

      if (!response.ok || 'error' in payload) {
        throw new Error(
          'error' in payload
            ? payload.error
            : 'We could not generate multimedia assets right now.',
        )
      }

      stopLoadingAnimation()
      setResult(payload.data)
      setResultRecordId(payload.id ?? null)
      setPhase('result')
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return
      stopLoadingAnimation()
      setResult(null)
      setResultRecordId(null)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not generate multimedia assets right now.',
      )
      setPhase('input')
    }
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.socialCopy.shareText)
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current)
      setCopied(true)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copying failed. Please copy the text manually.')
    }
  }

  function handleReset() {
    setPhase('input')
    setResult(null)
    setResultRecordId(null)
    setError('')
    setCopied(false)
  }

  // ─── Input Phase ─────────────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <div className="mx-auto max-w-3xl space-y-7">
        <Card className="border-border bg-card p-6 sm:p-7">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label className={UI_LABEL_CLASS} htmlFor="event-brief">
                Event Brief
              </Label>
              <Textarea
                className="min-h-32 resize-none bg-background text-sm leading-6"
                id="event-brief"
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe your event, audience, mood, and the kind of campaign you want to launch."
                value={brief}
              />
            </div>

            <div className="space-y-3">
              <p className={UI_LABEL_CLASS}>
                Quick Starts
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {EXAMPLE_BRIEFS.map((exampleBrief) => (
                  <Button
                    className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-xs leading-5"
                    key={exampleBrief}
                    onClick={() => setBrief(exampleBrief)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {exampleBrief.length > 80
                      ? exampleBrief.slice(0, 80) + '...'
                      : exampleBrief}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className={UI_LABEL_CLASS}>
                Poster Ratio
              </Label>
              <Select value={posterAspectRatio} onValueChange={(value) => setPosterAspectRatio(value as PosterAspectRatio)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select poster ratio" />
                </SelectTrigger>
                <SelectContent>
                  {POSTER_RATIO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="h-10 flex-1"
                disabled={brief.trim().length === 0}
                type="submit"
              >
                <IconSparkles size={16} />
                Generate Media Kit
                <IconArrowRight size={16} />
              </Button>
              <Button
                className="h-10"
                variant="outline"
                type="button"
                onClick={() =>
                  setBrief(
                    EXAMPLE_BRIEFS[Math.floor(Math.random() * EXAMPLE_BRIEFS.length)],
                  )
                }
              >
                <IconDice size={16} />
              </Button>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </Card>
      </div>
    )
  }

  // ─── Loading Phase ───────────────────────────────────────────────────────
  if (phase === 'loading') {
    const currentMessage = LOADING_MESSAGES[loadingStep]
    const CurrentIcon = currentMessage.icon

    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <IconLoader2 size={32} className="animate-spin text-primary" />
          </div>
        </div>
        <div className="mt-8 flex items-center gap-2 text-lg font-medium">
          <CurrentIcon size={20} className="text-primary" />
          {currentMessage.text}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          This usually takes 15-30 seconds
        </p>
      </div>
    )
  }

  // ─── Result Phase ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Generated Media Kit</h2>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <IconSparkles size={14} />
          Generate Another
        </Button>
      </div>
      {result && (
        <MultimediaResult
          copied={copied}
          onCopy={handleCopy}
          parentRecordId={resultRecordId}
          result={result}
        />
      )}
    </div>
  )
}

// ─── History Tab ─────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function HistoryTab({ initialData }: { initialData: MediaHistoryPage }) {
  const [data, setData] = useState(initialData)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const totalPages = Math.ceil(data.total / data.pageSize)

  const loadPage = useCallback(async (p: number) => {
    setLoading(true)
    setLoadError(null)
    try {
      const result = await getMediaHistory(p)
      setData(result)
      setPage(p)
    } catch {
      setLoadError('Failed to load history. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <IconHistory size={40} className="text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          No media generated yet. Switch to the Generate tab to create your first kit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex justify-center py-8">
          <IconLoader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading &&
        data.items.map((item) => (
          <HistoryCard key={item.id} item={item} />
        ))}

      {loadError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {loadError}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => loadPage(page - 1)}
          >
            <IconChevronLeft size={14} />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => loadPage(page + 1)}
          >
            Next
            <IconChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

function HistoryCard({ item }: { item: MediaHistoryItem }) {
  return (
    <Card className="overflow-hidden border-border bg-card">
      <Link
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/20 sm:px-5"
        href={`/media/${item.id}`}
      >
        {/* Poster thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted">
          <Image
            src={item.result.poster.imageDataUrl}
            alt={item.result.poster.alt}
            width={64}
            height={64}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.result.concept.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.brief}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">{dateFormatter.format(new Date(item.createdAt))}</span>
          <IconChevronRight size={14} />
        </div>
      </Link>
    </Card>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function MediaContent({
  initialHistory,
}: {
  initialHistory: MediaHistoryPage
}) {
  return (
    <Tabs defaultValue="generate" className="space-y-6">
      <TabsList>
        <TabsTrigger value="generate">
          <IconSparkles size={14} />
          Generate
        </TabsTrigger>
        <TabsTrigger value="history">
          <IconHistory size={14} />
          History
          {initialHistory.total > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
              {initialHistory.total}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generate">
        <GenerateTab />
      </TabsContent>

      <TabsContent value="history">
        <HistoryTab initialData={initialHistory} />
      </TabsContent>
    </Tabs>
  )
}
