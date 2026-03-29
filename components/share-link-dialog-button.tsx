'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconCheck, IconCopy, IconExternalLink } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShareLinkQRCode } from '@/components/share-link-qrcode'

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

function toAbsoluteUrl(url: string) {
  if (typeof window === 'undefined') {
    return url
  }

  try {
    return new URL(url, window.location.origin).toString()
  } catch {
    return url
  }
}

export function ShareLinkDialogButton({
  url,
  disabled = false,
  triggerSize = 'icon',
  triggerClassName,
  triggerTitle = 'Open public page',
  triggerAriaLabel = 'Open public page',
  iconSize = 16,
  dialogTitle = 'Share Public Page',
  dialogDescription = 'Scan this QR code or copy the link to share.',
}: {
  url: string
  disabled?: boolean
  triggerSize?: React.ComponentProps<typeof Button>['size']
  triggerClassName?: string
  triggerTitle?: string
  triggerAriaLabel?: string
  iconSize?: number
  dialogTitle?: string
  dialogDescription?: string
}) {
  const [fullUrl, setFullUrl] = useState(url)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setFullUrl(toAbsoluteUrl(url))
  }, [url])

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
    } catch {
      if (copyWithFallback(fullUrl)) {
        markCopied()
        return
      }

      setCopied(false)
      setCopyError('Copy failed. Please copy manually.')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={triggerSize}
          className={triggerClassName}
          disabled={disabled}
          title={triggerTitle}
          aria-label={triggerAriaLabel}
        >
          <IconExternalLink size={iconSize} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <ShareLinkQRCode url={fullUrl} size={144} showUrl={false} className="w-fit" />

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={fullUrl} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label={copied ? 'Link copied' : 'Copy public link'}
                title={copied ? 'Link copied' : 'Copy public link'}
              >
                {copied ? <IconCheck size={16} className="text-primary" /> : <IconCopy size={16} />}
              </Button>
            </div>
            <p aria-live="polite" className="text-xs text-muted-foreground">
              {copyError || (copied ? 'Link copied to clipboard.' : 'Share this link with your audience.')}
            </p>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href={fullUrl} target="_blank" rel="noopener noreferrer">
                <IconExternalLink size={14} />
                Open in New Tab
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
