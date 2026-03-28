'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconCopy, IconCheck } from '@tabler/icons-react'

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={fullUrl} className="font-mono text-sm" />
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Copy survey link'}
        title={copied ? 'Link copied' : 'Copy survey link'}
      >
        {copied ? <IconCheck size={16} className="text-primary" /> : <IconCopy size={16} />}
      </Button>
    </div>
  )
}
