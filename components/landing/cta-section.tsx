import Link from 'next/link'
import { IconArrowRight, IconBolt } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl border border-border bg-primary/5 px-8 py-16 text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-primary">
          <IconBolt size={22} className="text-primary-foreground" />
        </div>
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Ready to forge your next event?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          Start free. No credit card required. Your first event kit is one
          prompt away.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" className="shadow-md shadow-primary/20" asChild>
            <Link href="/register">
              Get Started Free
              <IconArrowRight size={16} />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
