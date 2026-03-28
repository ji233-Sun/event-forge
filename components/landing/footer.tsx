import Link from 'next/link'
import { IconBolt } from '@tabler/icons-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
        <Link href="/" className="flex items-center gap-2 group transition-all hover:scale-105 active:scale-95">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/20">
            <IconBolt size={14} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            EventForge
          </span>
        </Link>
        <p className="text-sm text-muted-foreground">
          2026 EventForge. Built for UNNC Hackathon.
        </p>
      </div>
    </footer>
  )
}
