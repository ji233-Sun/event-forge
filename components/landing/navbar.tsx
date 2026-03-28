import Link from 'next/link'
import { IconBolt } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group transition-all hover:scale-105 active:scale-95">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 ring-1 ring-primary/20 transition-all group-hover:shadow-primary/40 group-hover:rotate-6">
            <IconBolt size={20} className="text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            EventForge
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/studio">Studio</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/slides">Studio</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
