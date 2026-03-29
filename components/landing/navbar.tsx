import Link from 'next/link'
import { IconBolt } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary">
            <IconBolt size={16} className="text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">EventForge</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/slides">Slides</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/media">Media</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/surveys">Surveys</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
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
