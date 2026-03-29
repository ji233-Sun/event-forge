'use client'

import { useRef, useState } from 'react'
import { MultimediaResult } from '@/components/multimedia/multimedia-result'
import type { MediaHistoryItem } from '../actions'

export function MediaDetailContent({ record }: { record: MediaHistoryItem }) {
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy(text?: string) {
    const content = text ?? record.result.socialCopy.shareText
    navigator.clipboard.writeText(content).catch(() => {})
    if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current)
    setCopied(true)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <MultimediaResult
      copied={copied}
      initialPosterVariants={record.variants}
      onCopy={handleCopy}
      parentRecordId={record.id}
      result={record.result}
      showMusicGenerator={true}
      showPosterWorkspace={true}
    />
  )
}
