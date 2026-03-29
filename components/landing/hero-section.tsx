import Link from 'next/link'
import {
  IconSparkles,
  IconArrowRight,
  IconPresentation,
  IconPhoto,
  IconClipboardList,
  IconCode,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

const studios = [
  {
    icon: IconPresentation,
    title: 'Slide Studio',
    desc: 'AI pitch decks from a prompt',
    mockup: (
      <div className="mb-3 bg-zinc-900 p-3">
        <div className="mb-1.5 h-2 w-3/4 bg-white" />
        <div className="mb-3 h-1.5 w-1/2 bg-white/30" />
        <div className="h-1 w-1/4 bg-primary/80" />
      </div>
    ),
  },
  {
    icon: IconPhoto,
    title: 'Media Studio',
    desc: 'Posters, soundtracks & copy',
    mockup: (
      <div className="mb-3 grid grid-cols-2 gap-0.5 bg-zinc-800 p-1.5">
        <div className="h-8 bg-primary/50" />
        <div className="h-8 bg-zinc-700" />
        <div className="h-8 bg-zinc-600" />
        <div className="h-8 bg-primary/25" />
      </div>
    ),
  },
  {
    icon: IconClipboardList,
    title: 'Surveys',
    desc: 'Build & analyze feedback',
    mockup: (
      <div className="mb-3 border border-border bg-white p-2.5">
        <div className="mb-2 h-1.5 w-4/5 bg-zinc-200" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 border border-zinc-300" />
            <div className="h-1.5 w-2/3 bg-zinc-100" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 border border-primary bg-primary/10" />
            <div className="h-1.5 w-1/2 bg-zinc-100" />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: IconCode,
    title: 'Question Types',
    desc: 'AI-generated React components',
    mockup: (
      <div className="mb-3 bg-zinc-900 p-2.5 font-mono text-[9px] leading-relaxed">
        <span className="text-primary">&lt;Rating</span>
        <span className="text-zinc-400"> /&gt;</span>
        <br />
        <span className="text-primary">&lt;Slider</span>
        <span className="text-zinc-400"> /&gt;</span>
        <br />
        <span className="text-primary">&lt;ImagePick</span>
        <span className="text-zinc-400"> /&gt;</span>
      </div>
    ),
  },
]

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-14">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[45%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] h-[45%] w-[40%] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary">
          <IconSparkles size={13} />
          AI-Powered Event Toolkit
        </div>

        {/* Headline */}
        <h1 className="mb-5 text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
          One Brief.{' '}
          <span className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
            Complete Event Kit.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground md:text-lg">
          EventForge turns your event description into pitch decks, promotional
          media, interactive surveys, and custom question types — all in one
          place.
        </p>

        {/* CTAs */}
        <div className="mb-14 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="shadow-md shadow-primary/20" asChild>
            <Link href="/register">
              Get Started Free
              <IconArrowRight size={16} />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>

        {/* 4 mini studio cards */}
        <div className="grid grid-cols-2 gap-3 text-left md:grid-cols-4">
          {studios.map(({ icon: Icon, title, desc, mockup }) => (
            <div key={title} className="border border-border/60 bg-card p-3">
              {mockup}
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center bg-primary/10 text-primary">
                <Icon size={15} />
              </div>
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
