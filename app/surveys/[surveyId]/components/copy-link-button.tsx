'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconCopy, IconCheck } from '@tabler/icons-react'

function copyWithFallback(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [fullUrl, setFullUrl] = useState(path)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setFullUrl(`${window.location.origin}${path}`)
  }, [path])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function markCopied() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    setCopyError('')
    setCopied(true)
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      markCopied()
      return
    } catch (clipboardError) {
      if (copyWithFallback(fullUrl)) {
        markCopied()
        return
      }

      setCopied(false)
      setCopyError('Copy failed. Please copy the link manually.')
      console.error('Failed to copy survey link', clipboardError)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input readOnly value={fullUrl} className="font-mono text-sm" />
        <Button
          type="button"
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
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {copyError || (copied ? 'Link copied to clipboard.' : '')}
      </p>
    </div>
  )
}
