'use client'

import { useRef, useState } from 'react'
import { IconArrowRight, IconSparkles, IconWaveSine } from '@tabler/icons-react'

import { MultimediaResult } from '@/components/multimedia/multimedia-result'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { MultimediaExperience } from '@/lib/multimedia/types'

const EXAMPLE_BRIEFS = [
  'Next Friday we are hosting a cyberpunk campus music festival for 200 guests with neon visuals, a DJ warm-up set, and a sponsor-friendly promo push.',
  'Create launch media for a rooftop startup demo night with a polished, futuristic city-light aesthetic and a high-energy social caption.',
  'Build a warm summer street food night campaign with vibrant poster art, chill electronic music, and a playful community-first social teaser.',
]

type MultimediaApiResponse =
  | {
      data: MultimediaExperience
    }
  | {
      error: string
    }

export function MultimediaStudio() {
  const [brief, setBrief] = useState(EXAMPLE_BRIEFS[0])
  const [error, setError] = useState('')
  const [result, setResult] = useState<MultimediaExperience | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedBrief = brief.trim()
    if (!normalizedBrief) {
      setError('Please describe the event before generating multimedia assets.')
      return
    }

    setCopied(false)
    setError('')

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    void generateAssets(normalizedBrief, requestId)
  }

  async function generateAssets(normalizedBrief: string, requestId: number) {
    try {
      const response = await fetch('/api/multimedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief: normalizedBrief }),
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

      setResult(payload.data)
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return
      setResult(null)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not generate multimedia assets right now.',
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  async function handleCopy() {
    if (!result) {
      return
    }

    try {
      await navigator.clipboard.writeText(result.socialCopy.shareText)
      setCopied(true)
    } catch {
      setError('Copying failed. Please copy the text manually.')
    }
  }

  return (
    <section className="relative overflow-hidden px-4 py-24 md:px-6 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-12 right-0 h-64 w-64 rounded-full bg-primary/5 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <IconWaveSine size={16} />
            Multimedia Studio
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            Turn one event brief into a poster, soundtrack, and social push
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            This demo implements the multimedia lane from the EventForge design. Describe the
            event once and the studio will assemble a hero poster, a playable demo soundtrack, and
            share-ready launch copy.
          </p>
        </div>

        <div className="mt-12 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/60 bg-card/80 p-6 backdrop-blur-sm md:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <Label className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground" htmlFor="event-brief">
                  Event Brief
                </Label>
                <Textarea
                  className="min-h-48 resize-none bg-background/70 text-base leading-7"
                  id="event-brief"
                  onChange={(event) => setBrief(event.target.value)}
                  placeholder="Describe your event, audience, mood, and the kind of campaign you want to launch."
                  value={brief}
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Quick Starts
                </p>
                <div className="flex flex-wrap gap-3">
                  {EXAMPLE_BRIEFS.map((exampleBrief) => (
                    <Button
                      className="h-auto whitespace-normal px-4 py-2 text-left leading-5"
                      key={exampleBrief}
                      onClick={() => setBrief(exampleBrief)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {exampleBrief}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="h-11 w-full shadow-lg shadow-primary/20"
                disabled={isLoading || brief.trim().length === 0}
                size="lg"
                type="submit"
              >
                <IconSparkles size={18} />
                {isLoading ? 'Generating assets...' : 'Generate multimedia kit'}
                <IconArrowRight size={18} />
              </Button>

              <p className="text-sm leading-6 text-muted-foreground">
                The soundtrack uses a curated demo catalog for hackathon-speed playback while the
                poster and copy are generated from the event brief.
              </p>

              {error ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </form>
          </Card>

          {result ? (
            <MultimediaResult copied={copied} onCopy={handleCopy} result={result} />
          ) : (
            <Card className="border-dashed border-border/70 bg-card/60 p-8 backdrop-blur-sm">
              <div className="preview-slot-bg flex h-full min-h-96 flex-col justify-between rounded-md border border-border/60 p-6 text-primary-foreground">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
                    Preview Slot
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                    Your generated media kit appears here
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/70">
                    Submit a brief to render the poster artwork, soundtrack preview, and social
                    rollout copy side by side.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/50">Poster</p>
                    <p className="mt-3 text-sm text-primary-foreground/70">
                      Data-URL artwork generated from your event atmosphere.
                    </p>
                  </div>
                  <div className="rounded-md border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/50">Audio</p>
                    <p className="mt-3 text-sm text-primary-foreground/70">
                      A playable soundtrack match selected for the campaign mood.
                    </p>
                  </div>
                  <div className="rounded-md border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/50">Copy</p>
                    <p className="mt-3 text-sm text-primary-foreground/70">
                      Launch-ready social text with CTA and reusable hashtags.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}
