import Link from 'next/link'
import { IconSparkles, IconArrowRight, IconPresentation } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <IconSparkles size={16} />
          Powered by AI
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Craft Unforgettable Events{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            with AI
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          EventForge uses advanced AI to generate stunning presentations, create interactive
          content, and manage every aspect of your event — all from a single platform.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
            <Link href="/register">
              Get Started Free
              <IconArrowRight size={18} />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/studio">Launch Multimedia Studio</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/slides">
              Try Slide Studio
              <IconPresentation size={18} />
            </Link>
          </Button>
        </div>

        {/* Trust indicator */}
        <p className="mt-6 text-sm text-muted-foreground">
          Start from the landing page or jump straight into AI slide generation.
        </p>
      </div>
    </section>
  )
}
