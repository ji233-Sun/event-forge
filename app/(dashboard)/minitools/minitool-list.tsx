'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ShareLinkDialogButton } from '@/components/share-link-dialog-button'
import {
  IconTrash,
  IconCopy,
  IconUsers,
  IconTool,
  IconPencil,
} from '@tabler/icons-react'
import { deleteMinitool, toggleMinitoolPublic } from './actions'
import { getMinitoolEditorHref } from './editor-link'

type MinitoolItem = {
  id: string
  name: string
  isPublic: boolean
  createdAt: Date
  participantCount: number
}

export function MinitoolList({ initialTools }: { initialTools: MinitoolItem[] }) {
  const [tools, setTools] = useState(initialTools)
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleTogglePublic(id: string, current: boolean) {
    setTools((prev) => prev.map((t) => t.id === id ? { ...t, isPublic: !current } : t))
    startTransition(async () => {
      await toggleMinitoolPublic(id, !current)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    setTools((prev) => prev.filter((t) => t.id !== id))
    startTransition(async () => {
      await deleteMinitool(id)
      router.refresh()
    })
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/t/${id}`
    navigator.clipboard.writeText(url)
  }

  if (tools.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconTool size={28} />
        </div>
        <h3 className="mt-5 text-lg font-semibold">No minitools yet</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Create your first AI-powered interactive tool for your next live event.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <Card key={tool.id} className="border-border/40 shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/minitools/${tool.id}`} className="min-w-0 flex-1 group">
                <p className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                  {tool.name}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <IconUsers size={12} />
                  <span>{tool.participantCount} participants</span>
                </div>
              </Link>
              <Badge
                variant="outline"
                className={tool.isPublic
                  ? 'bg-green-500/5 text-green-600 border-green-200 text-[10px]'
                  : 'text-[10px]'}
              >
                {tool.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Share</span>
                <Switch
                  checked={tool.isPublic}
                  onCheckedChange={() => handleTogglePublic(tool.id, tool.isPublic)}
                  className="scale-75 origin-left"
                />
              </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                    title="Edit minitool"
                  >
                    <Link href={getMinitoolEditorHref(tool.id)}>
                      <IconPencil size={14} />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                  className="h-7 w-7"
                  onClick={() => copyLink(tool.id)}
                  disabled={!tool.isPublic}
                  title="Copy share link"
                >
                  <IconCopy size={14} />
                </Button>
                <ShareLinkDialogButton
                  url={`/t/${tool.id}`}
                  disabled={!tool.isPublic}
                  triggerSize="icon"
                  triggerClassName="h-7 w-7"
                  iconSize={14}
                  triggerTitle="Open public page"
                  triggerAriaLabel="Open public page"
                  dialogTitle="Share Minitool"
                  dialogDescription="Scan the QR code or copy this public link to share your minitool."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(tool.id)}
                  title="Delete minitool"
                >
                  <IconTrash size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
