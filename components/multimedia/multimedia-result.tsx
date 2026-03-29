"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  IconArrowsMaximize,
  IconCheck,
  IconCopy,
  IconCrop,
  IconDownload,
  IconLoader2,
  IconMusic,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconSparkles,
  IconWand,
  IconX,
} from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  DEFAULT_POSTER_ASPECT_RATIO,
  POSTER_ASPECT_RATIO_OPTIONS,
  type MultimediaExperience,
  type MusicGenerationResponsePayload,
  type PosterAspectRatio,
  type PosterRegenerateRequestPayload,
  type PosterRegenerateResponsePayload,
  type PosterVariant,
  type Soundtrack,
} from '@/lib/multimedia/types'

type MultimediaResultProps = {
  copied: boolean
  initialPosterVariants?: PosterVariant[]
  onCopy: () => void
  parentRecordId?: string | null
  result: MultimediaExperience
  showMusicGenerator?: boolean
  showPosterWorkspace?: boolean
}

type MusicApiResponse = MusicGenerationResponsePayload | { error: string }
type PosterApiResponse = PosterRegenerateResponsePayload | { error: string }

type PromptDraftModel = {
  basePrompt: string
  styleModifiers: string[]
}

const EMPTY_POSTER_VARIANTS: PosterVariant[] = []
const MAX_STYLE_MODIFIERS = 8

const POSTER_RATIO_LABELS: Record<PosterAspectRatio, string> = {
  '16:9': 'Widescreen 16:9',
  '4:5': 'Portrait 4:5',
  '1:1': 'Square 1:1',
  '9:16': 'Story 9:16',
}

const POSTER_ASPECT_CLASSES: Record<PosterAspectRatio, string> = {
  '16:9': 'aspect-[16/9]',
  '4:5': 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
}

const UI_LABEL_CLASS = 'text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normaliseRatio(ratio?: PosterAspectRatio): PosterAspectRatio {
  return ratio ?? DEFAULT_POSTER_ASPECT_RATIO
}

function buildBasePosterVariant(result: MultimediaExperience): PosterVariant {
  return {
    id: 'base-poster',
    parentId: null,
    imageDataUrl: result.poster.imageDataUrl,
    prompt: result.poster.prompt,
    aspectRatio: normaliseRatio(result.poster.aspectRatio),
    createdAt: new Date(0).toISOString(),
  }
}

function sanitizePromptToken(value: string) {
  return value
    .trim()
    .replace(/^[-•]\s*/, '')
    .replace(/^style modifiers?:\s*/i, '')
    .replace(/[.;:]+$/, '')
}

function dedupeStyleModifiers(modifiers: string[]) {
  const output: string[] = []
  const seen = new Set<string>()

  for (const modifier of modifiers) {
    const normalized = sanitizePromptToken(modifier)
    if (!normalized) continue

    const key = normalized.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    output.push(normalized)
    if (output.length >= MAX_STYLE_MODIFIERS) break
  }

  return output
}

function parsePromptStructure(prompt: string): PromptDraftModel {
  const normalizedPrompt = prompt.trim()
  if (!normalizedPrompt) {
    return { basePrompt: '', styleModifiers: [] }
  }

  const lines = normalizedPrompt
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length > 1) {
    const [basePromptLine, ...modifierLines] = lines
    const modifiers = dedupeStyleModifiers(
      modifierLines.flatMap((line) => line.split(',')),
    )

    return {
      basePrompt: basePromptLine,
      styleModifiers: modifiers,
    }
  }

  const commaSeparated = normalizedPrompt
    .split(',')
    .map((part) => sanitizePromptToken(part))
    .filter(Boolean)

  if (commaSeparated.length <= 1) {
    return {
      basePrompt: normalizedPrompt,
      styleModifiers: [],
    }
  }

  return {
    basePrompt: commaSeparated[0],
    styleModifiers: dedupeStyleModifiers(commaSeparated.slice(1)),
  }
}

function composePosterPrompt(basePrompt: string, styleModifiers: string[]) {
  const normalizedBase = basePrompt.trim()
  if (!normalizedBase) {
    return ''
  }

  const normalizedModifiers = dedupeStyleModifiers(styleModifiers)
  if (normalizedModifiers.length === 0) {
    return normalizedBase
  }

  return `${normalizedBase}\nStyle modifiers: ${normalizedModifiers.join(', ')}`
}

function buildVariantTooltip(prompt: string) {
  const parsed = parsePromptStructure(prompt)
  if (parsed.styleModifiers.length === 0) {
    return parsed.basePrompt
  }

  return `${parsed.basePrompt}\n+ ${parsed.styleModifiers.slice(0, 3).join(', ')}`
}

function formatVariantCount(count: number) {
  return count === 1 ? '1 variant' : `${count} variants`
}

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getBaseSoundtrack(result: MultimediaExperience): Soundtrack | null {
  return result.soundtrack ?? null
}

export function MultimediaResult({
  copied,
  initialPosterVariants,
  onCopy,
  parentRecordId,
  result,
  showMusicGenerator = true,
  showPosterWorkspace = true,
}: MultimediaResultProps) {
  const incomingPosterVariants = initialPosterVariants ?? EMPTY_POSTER_VARIANTS
  const promptSeed = useMemo(() => parsePromptStructure(result.poster.prompt), [result.poster.prompt])

  const [activePosterId, setActivePosterId] = useState('base-poster')
  const [isPosterLoading, setIsPosterLoading] = useState(false)
  const [isPosterPreviewOpen, setIsPosterPreviewOpen] = useState(false)
  const [isPromptEditing, setIsPromptEditing] = useState(false)
  const [newStyleTag, setNewStyleTag] = useState('')
  const [posterError, setPosterError] = useState('')
  const [posterVariants, setPosterVariants] = useState<PosterVariant[]>(() => incomingPosterVariants)
  const [basePromptDraft, setBasePromptDraft] = useState(promptSeed.basePrompt)
  const [styleModifiersDraft, setStyleModifiersDraft] = useState<string[]>(promptSeed.styleModifiers)
  const [selectedRatio, setSelectedRatio] = useState<PosterAspectRatio>(
    normaliseRatio(result.poster.aspectRatio),
  )
  const [highlightRatioControl, setHighlightRatioControl] = useState(false)
  const [musicPrompt, setMusicPrompt] = useState('')
  const [withLyrics, setWithLyrics] = useState(false)
  const [soundtrack, setSoundtrack] = useState<Soundtrack | null>(() => getBaseSoundtrack(result))
  const [musicError, setMusicError] = useState('')
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false)
  const ratioHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const basePosterVariant = useMemo(() => buildBasePosterVariant(result), [result])

  useEffect(() => {
    const nextPromptSeed = parsePromptStructure(result.poster.prompt)

    setActivePosterId('base-poster')
    setIsPosterLoading(false)
    setIsPosterPreviewOpen(false)
    setIsPromptEditing(false)
    setNewStyleTag('')
    setPosterError('')
    setPosterVariants(incomingPosterVariants)
    setBasePromptDraft(nextPromptSeed.basePrompt)
    setStyleModifiersDraft(nextPromptSeed.styleModifiers)
    setSelectedRatio(normaliseRatio(result.poster.aspectRatio))
    setMusicPrompt('')
    setWithLyrics(false)
    setSoundtrack(getBaseSoundtrack(result))
    setMusicError('')
    setIsGeneratingMusic(false)
  // Use result.poster.imageDataUrl as a stable identifier so the effect only fires
  // when the actual result changes — not when the parent re-renders with a new object reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingPosterVariants, result.poster.imageDataUrl])

  useEffect(() => {
    return () => {
      if (ratioHighlightTimeoutRef.current !== null) {
        clearTimeout(ratioHighlightTimeoutRef.current)
      }
    }
  }, [])

  const posterGallery = useMemo(() => {
    const sortedVariants = [...posterVariants].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })

    const unique: PosterVariant[] = [basePosterVariant]
    const ids = new Set<string>([basePosterVariant.id])

    for (const variant of sortedVariants) {
      if (ids.has(variant.id)) continue
      ids.add(variant.id)
      unique.push({
        ...variant,
        aspectRatio: normaliseRatio(variant.aspectRatio),
      })
    }

    return unique
  }, [basePosterVariant, posterVariants])

  const activePoster = useMemo(() => {
    return posterGallery.find((variant) => variant.id === activePosterId) ?? posterGallery[0]
  }, [activePosterId, posterGallery])

  useEffect(() => {
    if (!posterGallery.some((variant) => variant.id === activePosterId)) {
      setActivePosterId(posterGallery[0]?.id ?? 'base-poster')
    }
  }, [activePosterId, posterGallery])

  const hasGeneratedMusic = soundtrack !== null

  const soundtrackTitle = soundtrack?.title ?? (withLyrics ? 'Generated Song' : 'Generated Instrumental')

  const soundtrackDescription = soundtrack?.description ?? 'Describe the music you want and generate it on demand.'

  const canRegeneratePoster =
    showPosterWorkspace && !isPosterLoading && basePromptDraft.trim().length > 0

  function selectPosterVariant(id: string) {
    const nextPoster = posterGallery.find((variant) => variant.id === id)
    if (!nextPoster) {
      return
    }

    const parsedPrompt = parsePromptStructure(nextPoster.prompt)

    setActivePosterId(nextPoster.id)
    setBasePromptDraft(parsedPrompt.basePrompt)
    setStyleModifiersDraft(parsedPrompt.styleModifiers)
    setSelectedRatio(nextPoster.aspectRatio)
    setIsPromptEditing(false)
    setPosterError('')
  }

  function handleDownloadPoster() {
    const anchor = document.createElement('a')
    anchor.href = activePoster.imageDataUrl
    anchor.download = `${slugify(result.concept.title) || 'event-forge-poster'}-${activePoster.aspectRatio}.png`
    anchor.click()
  }

  function handleRatioShortcut() {
    setHighlightRatioControl(true)

    if (ratioHighlightTimeoutRef.current !== null) {
      clearTimeout(ratioHighlightTimeoutRef.current)
    }

    ratioHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightRatioControl(false)
    }, 1400)
  }

  function handleAddStyleTag() {
    const nextTag = sanitizePromptToken(newStyleTag)
    if (!nextTag) {
      return
    }

    setStyleModifiersDraft((prev) => dedupeStyleModifiers([...prev, nextTag]))
    setNewStyleTag('')
    setPosterError('')
  }

  function handleRemoveStyleTag(tag: string) {
    setStyleModifiersDraft((prev) => prev.filter((item) => item.toLowerCase() !== tag.toLowerCase()))
    setPosterError('')
  }

  function handleCancelPromptEdit() {
    const parsedPrompt = parsePromptStructure(activePoster.prompt)

    setBasePromptDraft(parsedPrompt.basePrompt)
    setStyleModifiersDraft(parsedPrompt.styleModifiers)
    setSelectedRatio(activePoster.aspectRatio)
    setIsPromptEditing(false)
    setPosterError('')
  }

  function handleApplyPromptEdit() {
    const normalizedBasePrompt = basePromptDraft.trim()
    if (!normalizedBasePrompt) {
      setPosterError('Base prompt cannot be empty.')
      return
    }

    setBasePromptDraft(normalizedBasePrompt)
    setStyleModifiersDraft((prev) => dedupeStyleModifiers(prev))
    setIsPromptEditing(false)
    setPosterError('')
  }

  async function handleRegeneratePoster() {
    const finalPrompt = composePosterPrompt(basePromptDraft, styleModifiersDraft)
    if (!finalPrompt) {
      setPosterError('Base prompt cannot be empty.')
      return
    }

    setIsPosterLoading(true)
    setPosterError('')

    try {
      const requestPayload: PosterRegenerateRequestPayload = {
        parentId: parentRecordId ?? undefined,
        brief: result.brief,
        conceptTitle: result.concept.title,
        visualDirection: result.concept.visualDirection,
        prompt: finalPrompt,
        aspectRatio: selectedRatio,
      }

      const response = await fetch('/api/multimedia/poster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const payload = (await response.json()) as PosterApiResponse
      if (!response.ok || 'error' in payload) {
        throw new Error(
          'error' in payload ? payload.error : 'Poster regeneration failed. Please try again.',
        )
      }

      const parsedPrompt = parsePromptStructure(payload.variant.prompt)

      setPosterVariants((prev) => {
        const next = [payload.variant, ...prev]
        const seen = new Set<string>()
        return next.filter((variant) => {
          if (seen.has(variant.id)) return false
          seen.add(variant.id)
          return true
        })
      })
      setActivePosterId(payload.variant.id)
      setBasePromptDraft(parsedPrompt.basePrompt)
      setStyleModifiersDraft(parsedPrompt.styleModifiers)
      setSelectedRatio(payload.variant.aspectRatio)
    } catch (error) {
      setPosterError(
        error instanceof Error
          ? error.message
          : 'Poster regeneration failed. Please try again.',
      )
    } finally {
      setIsPosterLoading(false)
    }
  }

  async function handleGenerateMusic() {
    setIsGeneratingMusic(true)
    setMusicError('')

    try {
      const response = await fetch('/api/multimedia/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: musicPrompt.trim() || result.concept.visualDirection,
          withLyrics,
          parentId: parentRecordId ?? undefined,
        }),
      })

      const payload = (await response.json()) as MusicApiResponse

      if (!response.ok || 'error' in payload) {
        throw new Error(
          'error' in payload ? payload.error : 'Music generation failed. Please try again.',
        )
      }

      setSoundtrack(payload.soundtrack)
    } catch (error) {
      setMusicError(
        error instanceof Error
          ? error.message
          : 'Music generation failed. Please try again.',
      )
    } finally {
      setIsGeneratingMusic(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
      <Card className="overflow-hidden border-border/60 bg-card/80 p-0 backdrop-blur-sm">
        <div className="border-b border-border/60 px-6 py-5">
          <Badge
            className="h-7 gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"
            variant="outline"
          >
            <IconPhoto size={14} />
            Poster Direction
          </Badge>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{result.concept.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {result.concept.visualDirection}
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <section className="rounded-xl border border-border bg-background/80 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={UI_LABEL_CLASS}>
                  Prompt Workspace
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {showPosterWorkspace
                    ? 'Edit base description and style modifiers independently for cleaner control.'
                    : 'Prompt snapshot captured for this saved variant set.'}
                </p>
              </div>
              {showPosterWorkspace ? (
                <Button
                  onClick={() => setIsPromptEditing((prev) => !prev)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <IconPencil size={14} />
                  {isPromptEditing ? 'Close Editor' : 'Edit Base Prompt'}
                </Button>
              ) : null}
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className={UI_LABEL_CLASS}>
                  Base Prompt
                </Label>
                {isPromptEditing && showPosterWorkspace ? (
                  <Textarea
                    aria-label="Base poster prompt"
                    className="min-h-28 resize-y border-border bg-background/70 text-foreground shadow-none"
                    onChange={(event) => setBasePromptDraft(event.target.value)}
                    value={basePromptDraft}
                  />
                ) : (
                  <p className="rounded-md border border-border/80 bg-background/60 px-3 py-2.5 text-sm leading-6 text-foreground/90">
                    {basePromptDraft || 'No base prompt available for this variant.'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className={UI_LABEL_CLASS}>
                    Style Modifiers
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {styleModifiersDraft.length}/{MAX_STYLE_MODIFIERS}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {styleModifiersDraft.map((tag) => (
                    <div
                      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 text-xs"
                      key={tag.toLowerCase()}
                    >
                      <span className="max-w-[20rem] truncate" title={tag}>
                        {tag}
                      </span>
                      {showPosterWorkspace ? (
                        <button
                          aria-label={`Remove ${tag}`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          onClick={() => handleRemoveStyleTag(tag)}
                          type="button"
                        >
                          <IconX size={12} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {styleModifiersDraft.length === 0 ? (
                    <span className="rounded-md border border-dashed border-border/70 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
                      {showPosterWorkspace
                        ? 'Add style tokens like color grading, typography, and lighting mood.'
                        : 'No style modifiers saved for this variant.'}
                    </span>
                  ) : null}
                </div>

                {showPosterWorkspace ? (
                  <div className="relative mt-2">
                    <Input
                      aria-label="Add style modifier"
                      className="h-9 border-border bg-background/70 pr-10 shadow-none"
                      onChange={(event) => setNewStyleTag(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleAddStyleTag()
                        }
                      }}
                      placeholder="Add style modifier"
                      value={newStyleTag}
                    />
                    <Button
                      aria-label="Add style modifier"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={handleAddStyleTag}
                      size="icon-xs"
                      type="button"
                      variant="secondary"
                    >
                      <IconPlus size={12} />
                    </Button>
                  </div>
                ) : null}
              </div>

              {isPromptEditing && showPosterWorkspace ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleApplyPromptEdit} size="sm" type="button">
                    Apply Prompt Changes
                  </Button>
                  <Button onClick={handleCancelPromptEdit} size="sm" type="button" variant="outline">
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <div className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div
              className={cn(
                'rounded-md border border-border/80 bg-background px-3 py-2 transition-all',
                highlightRatioControl && 'ring-2 ring-primary/30',
              )}
            >
              {showPosterWorkspace ? (
                <div className="flex items-center gap-2">
                  <Label className={UI_LABEL_CLASS}>
                    Canvas Ratio
                  </Label>
                  <Select
                    disabled={isPosterLoading}
                    onValueChange={(value) => setSelectedRatio(value as PosterAspectRatio)}
                    value={selectedRatio}
                  >
                    <SelectTrigger className="min-w-40" size="sm">
                      <SelectValue placeholder="Ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSTER_ASPECT_RATIO_OPTIONS.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {POSTER_RATIO_LABELS[ratio]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-1">
                  <IconCrop className="text-muted-foreground" size={14} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {POSTER_RATIO_LABELS[activePoster.aspectRatio]}
                  </span>
                </div>
              )}
            </div>

            {showPosterWorkspace ? (
              <Button
                className="h-9 shadow-sm"
                disabled={!canRegeneratePoster}
                onClick={handleRegeneratePoster}
                type="button"
              >
                {isPosterLoading ? (
                  <IconLoader2 className="animate-spin" size={16} />
                ) : (
                  <IconWand size={16} />
                )}
                {posterGallery.length > 1 ? 'Regenerate Variant' : 'Generate Variant'}
              </Button>
            ) : null}
          </div>

          <div
            className={cn(
              'group relative overflow-hidden rounded-lg border border-border bg-[var(--poster-frame)] p-2',
            )}
          >
            <div
              className={cn(
                'relative overflow-hidden rounded-md border border-border/80 bg-muted',
                POSTER_ASPECT_CLASSES[activePoster.aspectRatio],
              )}
            >
              {isPosterLoading ? (
                <div className="absolute inset-0 space-y-3 p-4">
                  <Skeleton className="h-2/3 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <Image
                  alt={result.poster.alt}
                  className="object-cover transition duration-300 group-hover:scale-[1.01]"
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  src={activePoster.imageDataUrl}
                  unoptimized
                />
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Button
                  aria-label="Download poster"
                  onClick={handleDownloadPoster}
                  size="icon-sm"
                  type="button"
                  variant="secondary"
                >
                  <IconDownload size={16} />
                </Button>
                <Button
                  aria-label="Open poster preview"
                  onClick={() => setIsPosterPreviewOpen(true)}
                  size="icon-sm"
                  type="button"
                  variant="secondary"
                >
                  <IconArrowsMaximize size={16} />
                </Button>
                {showPosterWorkspace ? (
                  <Button
                    aria-label="Adjust ratio"
                    onClick={handleRatioShortcut}
                    size="icon-sm"
                    type="button"
                    variant="secondary"
                  >
                    <IconCrop size={16} />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {posterError ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {posterError}
            </div>
          ) : null}

          <section className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className={UI_LABEL_CLASS}>
                Variant Timeline
              </p>
              <span className="text-xs text-muted-foreground">
                {formatVariantCount(posterGallery.length)}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {posterGallery.map((variant, index) => {
                const isActive = activePoster.id === variant.id
                const tooltipText = buildVariantTooltip(variant.prompt)

                return (
                  <button
                    className="group/variant relative h-20 w-28 shrink-0"
                    key={variant.id}
                    onClick={() => selectPosterVariant(variant.id)}
                    type="button"
                  >
                    <div
                      className={cn(
                        'relative h-full w-full overflow-hidden rounded-md border bg-muted transition-all duration-200',
                        isActive
                          ? 'border-primary ring-2 ring-primary/35 opacity-100'
                          : 'border-border/80 opacity-60 saturate-75 hover:border-primary/60 hover:opacity-100 hover:saturate-100',
                      )}
                    >
                      <Image
                        alt={`${result.poster.alt} variant ${index + 1}`}
                        className="object-cover transition-transform duration-200 group-hover/variant:scale-105"
                        fill
                        sizes="112px"
                        src={variant.imageDataUrl}
                        unoptimized
                      />
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] text-white">
                        {index === 0 ? 'Base' : `V${index}`}
                      </span>
                    </div>

                    <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-56 -translate-x-1/2 -translate-y-full rounded-md border border-border/70 bg-popover/95 p-2 text-left text-[11px] leading-4 text-popover-foreground shadow-lg group-hover/variant:block">
                      <p className="max-h-20 overflow-hidden whitespace-pre-wrap">
                        {tooltipText}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </Card>

      <Dialog open={isPosterPreviewOpen} onOpenChange={setIsPosterPreviewOpen}>
        <DialogContent className="max-w-4xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{result.concept.title}</DialogTitle>
            <DialogDescription>
              {POSTER_RATIO_LABELS[activePoster.aspectRatio]} • {result.poster.alt}
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              'relative mx-auto w-full overflow-hidden rounded-lg border border-border/70 bg-black/75',
              POSTER_ASPECT_CLASSES[activePoster.aspectRatio],
            )}
          >
            <Image
              alt={result.poster.alt}
              className="object-contain"
              fill
              sizes="(max-width: 1024px) 100vw, 70vw"
              src={activePoster.imageDataUrl}
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {showMusicGenerator ? (
          <Card className="border-border/60 bg-card/80 p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  <IconMusic size={14} />
                  Soundtrack Match
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">
                  {soundtrackTitle}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {soundtrackDescription}
                </p>
              </div>
              {soundtrack ? (
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                  {soundtrack.durationLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Music Prompt
                </Label>
                <Textarea
                  aria-label="Music generation prompt"
                  className="min-h-20 resize-y border-border bg-background/70 text-foreground shadow-none"
                  disabled={isGeneratingMusic}
                  onChange={(event) => setMusicPrompt(event.target.value)}
                  placeholder={`Describe the music you want — style, mood, energy… (defaults to poster direction)`}
                  value={musicPrompt}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/80 bg-background/60 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Include Lyrics</p>
                  <p className="text-xs text-muted-foreground">
                    {withLyrics ? 'AI will write lyrics and generate a song.' : 'Pure instrumental, no vocals.'}
                  </p>
                </div>
                <button
                  aria-label="Toggle lyrics"
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    withLyrics ? 'bg-primary' : 'bg-input',
                  )}
                  disabled={isGeneratingMusic}
                  onClick={() => setWithLyrics((prev) => !prev)}
                  role="switch"
                  aria-checked={withLyrics}
                  type="button"
                >
                  <span
                    className={cn(
                      'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
                      withLyrics ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>

            <Button className="mt-4 w-full" disabled={isGeneratingMusic} onClick={handleGenerateMusic} type="button">
              {isGeneratingMusic ? <IconLoader2 size={16} className="animate-spin" /> : <IconMusic size={16} />}
              {hasGeneratedMusic ? 'Regenerate Music' : 'Generate Music'}
            </Button>

            {musicError ? (
              <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {musicError}
              </div>
            ) : null}

            {soundtrack ? (
              <div className="mt-5 space-y-3">
                <audio className="w-full" controls preload="none" src={soundtrack.previewUrl}>
                  Your browser does not support audio playback.
                </audio>
                {soundtrack.lyrics ? (
                  <details className="rounded-md border border-border/70 bg-muted/30">
                    <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Lyrics
                    </summary>
                    <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap px-3 pb-3 pt-1 text-sm leading-6 text-foreground/80">
                      {soundtrack.lyrics}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Music is generated on demand and kept only in this browser session.
              </p>
            )}
          </Card>
        ) : null}

        <Card className="border-border/60 bg-card/80 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                <IconSparkles size={14} />
                Social Copy
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Ready for Xiaohongshu, Moments, or an email teaser.
              </p>
            </div>
            <Button onClick={onCopy} size="sm" type="button" variant="outline">
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <Textarea
            aria-label="Social share text"
            className="mt-5 min-h-40 resize-none"
            readOnly
            value={result.socialCopy.shareText}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {result.socialCopy.hashtags.map((hashtag, index) => (
              <span
                key={`${hashtag}-${index}`}
                className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground"
              >
                {hashtag}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
