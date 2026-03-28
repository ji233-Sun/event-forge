import Image from 'next/image'
import {
  IconCheck,
  IconCopy,
  IconMusic,
  IconPhoto,
  IconSparkles,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { MultimediaExperience } from '@/lib/multimedia/types'

type MultimediaResultProps = {
  copied: boolean
  onCopy: () => void
  result: MultimediaExperience
}

export function MultimediaResult({
  copied,
  onCopy,
  result,
}: MultimediaResultProps) {
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
        <Card className="border-border/60 bg-card/80 p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                <IconMusic size={14} />
                Soundtrack Match
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                {result.soundtrack.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {result.soundtrack.description}
              </p>
            </div>
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
              {result.soundtrack.durationLabel}
            </span>
          </div>

          <audio className="mt-5 w-full" controls preload="none" src={result.soundtrack.previewUrl}>
            Your browser does not support audio playback.
          </audio>
        </Card>

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

          <Textarea className="mt-5 min-h-40 resize-none" readOnly value={result.socialCopy.shareText} />

          <div className="mt-4 flex flex-wrap gap-2">
            {result.socialCopy.hashtags.map((hashtag) => (
              <span
                key={hashtag}
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
