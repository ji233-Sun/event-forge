'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconCopy, IconCheck } from '@tabler/icons-react'

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

  async function handleCopy() {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={fullUrl} className="font-mono text-sm" />
      <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
        {copied ? <IconCheck size={16} className="text-green-600" /> : <IconCopy size={16} />}
      </Button>
    </div>
  )
}
