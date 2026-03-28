'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  IconPlus, 
  IconTrash, 
  IconWand, 
  IconSearch, 
  IconCalendar, 
  IconChartBar, 
  IconDotsVertical,
  IconEye,
  IconCopy,
  IconSparkles
} from '@tabler/icons-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { deleteCustomType } from './actions'

interface QuestionType {
  id: string
  name: string
  prompt: string
  createdAt: Date
  usageCount: number
}

export function QuestionTypeList({ initialTypes }: { initialTypes: QuestionType[] }) {
  const [types, setTypes] = useState(initialTypes)
  const [search, setSearch] = useState('')

  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.prompt.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this question type? This will remove it from surveys using it.')) return
    await deleteCustomType(id)
    setTypes(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Filters & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm group">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your library..."
            className="h-9 w-full rounded-md border border-border/60 bg-card px-9 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none font-medium px-2 py-0.5 text-[11px]">
            {filteredTypes.length} {filteredTypes.length === 1 ? 'Component' : 'Components'}
          </Badge>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_100px_100px_100px] gap-4 border-b bg-muted/30 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          <span>Component Name</span>
          <span>Prompt / Purpose</span>
          <span className="text-center">Usage</span>
          <span className="text-center">Status</span>
          <span className="text-right">Actions</span>
        </div>

        {filteredTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 text-primary mb-4">
              <IconSparkles size={32} stroke={1.5} />
            </div>
            <h2 className="text-lg font-bold">No components found</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm text-center">
              {search ? `Try adjusting your search for "${search}"` : 'Build your first AI-powered survey component to get started.'}
            </p>
            {!search && (
              <Button asChild size="sm" className="mt-6">
                <Link href="/question-types/new">
                  <IconPlus size={16} className="mr-2" />
                  Create New Type
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredTypes.map((type) => (
              <div 
                key={type.id} 
                className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_100px_100px_100px] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                    <IconWand size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold group-hover:text-primary transition-colors">
                      {type.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                      <IconCalendar size={10} />
                      {formatDistanceToNow(new Date(type.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Prompt */}
                <div className="min-w-0">
                  <p className="text-[12px] text-muted-foreground line-clamp-1 italic font-medium leading-relaxed bg-muted/30 px-2 py-1 rounded border border-border/20">
                    &ldquo;{type.prompt}&rdquo;
                  </p>
                </div>

                {/* Usage */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold tabular-nums">
                      {type.usageCount}
                    </span>
                    <span className="text-[9px] uppercase tracking-tighter font-bold text-muted-foreground/60">
                      Surveys
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-600">Active</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="View & Configure">
                    <Link href={`/question-types/new?id=${type.id}`}>
                      <IconEye size={14} />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate">
                    <IconCopy size={14} />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <IconDotsVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 p-1">
                      <DropdownMenuItem 
                        onClick={() => handleDelete(type.id)}
                        className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 py-2"
                      >
                        <IconTrash size={14} /> Delete Type
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
