"use client"

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconMusic,
  IconPhoto,
  IconSparkles,
} from '@tabler/icons-react'

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
import {
  DEFAULT_MUSIC_GENERATION_CONTROLS,
  MUSIC_DURATION_OPTIONS,
  MUSIC_INSTRUMENTATION_OPTIONS,
  MUSIC_MOOD_OPTIONS,
  MUSIC_TEMPO_OPTIONS,
  type MultimediaExperience,
  type MusicGenerationControls,
  type MusicGenerationResponsePayload,
  type Soundtrack,
} from '@/lib/multimedia/types'

type MultimediaResultProps = {
  copied: boolean
  onCopy: () => void
  result: MultimediaExperience
  showMusicGenerator?: boolean
}

type MusicApiResponse = MusicGenerationResponsePayload | { error: string }

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getBaseSoundtrack(result: MultimediaExperience): Soundtrack | null {
  return result.soundtrack ?? null
}

export function MultimediaResult({
  copied,
  onCopy,
  result,
  showMusicGenerator = true,
}: MultimediaResultProps) {
  const [controls, setControls] = useState<MusicGenerationControls>(DEFAULT_MUSIC_GENERATION_CONTROLS)
  const [soundtrack, setSoundtrack] = useState<Soundtrack | null>(() => getBaseSoundtrack(result))
  const [musicError, setMusicError] = useState('')
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false)

  const hasGeneratedMusic = soundtrack !== null

  const soundtrackTitle = useMemo(() => {
    if (soundtrack) {
      return soundtrack.title
    }

    return `${toTitle(controls.mood)} ${toTitle(controls.instrumentation)} Instrumental`
  }, [controls.instrumentation, controls.mood, soundtrack])

  const soundtrackDescription = useMemo(() => {
    if (soundtrack) {
      return soundtrack.description
    }

    return `Generate a ${controls.tempo} ${controls.mood} instrumental with ${controls.instrumentation}-led textures, aligned to the poster direction.`
  }, [controls.instrumentation, controls.mood, controls.tempo, soundtrack])

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
          brief: result.brief,
          conceptTitle: result.concept.title,
          visualDirection: result.concept.visualDirection,
          controls,
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

  function updateControl<K extends keyof MusicGenerationControls>(key: K, value: MusicGenerationControls[K]) {
    setControls((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="overflow-hidden border-border/60 bg-card/80 p-0 backdrop-blur-sm">
        <div className="border-b border-border/60 px-6 py-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
            <IconPhoto size={14} />
            Poster Direction
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{result.concept.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {result.concept.visualDirection}
          </p>
        </div>

        <div className="bg-[var(--poster-frame)] p-4">
          <Image
            alt={result.poster.alt}
            className="aspect-[4/3] w-full rounded-md object-cover"
            height={900}
            src={result.poster.imageDataUrl}
            unoptimized
            width={1200}
          />
        </div>
      </Card>

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

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Duration</Label>
                <Select
                  disabled={isGeneratingMusic}
                  value={String(controls.durationSeconds)}
                  onValueChange={(value) => updateControl('durationSeconds', Number(value) as MusicGenerationControls['durationSeconds'])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Mood</Label>
                <Select
                  disabled={isGeneratingMusic}
                  value={controls.mood}
                  onValueChange={(value) => updateControl('mood', value as MusicGenerationControls['mood'])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_MOOD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {toTitle(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tempo</Label>
                <Select
                  disabled={isGeneratingMusic}
                  value={controls.tempo}
                  onValueChange={(value) => updateControl('tempo', value as MusicGenerationControls['tempo'])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_TEMPO_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {toTitle(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Instrumentation</Label>
                <Select
                  disabled={isGeneratingMusic}
                  value={controls.instrumentation}
                  onValueChange={(value) => updateControl('instrumentation', value as MusicGenerationControls['instrumentation'])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select instrumentation" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSIC_INSTRUMENTATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {toTitle(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <audio className="mt-5 w-full" controls preload="none" src={soundtrack.previewUrl}>
                Your browser does not support audio playback.
              </audio>
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

          <Textarea aria-label="Social share text" className="mt-5 min-h-40 resize-none" readOnly value={result.socialCopy.shareText} />

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
