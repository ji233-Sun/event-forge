'use client'

import { Button } from '@/components/ui/button'
import { IconCopy } from '@tabler/icons-react'

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5"
      onClick={() => navigator.clipboard.writeText(url)}
    >
      <IconCopy size={14} />Copy link
    </Button>
  )
}
