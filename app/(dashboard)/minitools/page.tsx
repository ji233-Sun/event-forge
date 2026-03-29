import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IconPlus, IconTool } from '@tabler/icons-react'
import { getUserMinitools } from './actions'
import { MinitoolList } from './minitool-list'

export default async function MinitoolsPage() {
  const tools = await getUserMinitools()

  return (
    <div className="min-h-full bg-background/50">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <IconTool size={14} />
              Live Tools
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Minitools
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              AI-generated interactive tools for your live events. Share a link, let your audience participate.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 px-6 shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98]">
            <Link href="/minitools/new" className="flex items-center gap-2">
              <IconPlus size={18} />
              <span className="font-bold">New Minitool</span>
            </Link>
          </Button>
        </div>
        <MinitoolList initialTools={tools} />
      </div>
    </div>
  )
}
