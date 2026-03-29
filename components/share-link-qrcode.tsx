'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'

const qrSizeClassMap: Record<number, string> = {
  96: 'size-24',
  108: 'size-[108px]',
  120: 'size-[120px]',
  144: 'size-36',
  160: 'size-40',
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

export function ShareLinkQRCode({
  url,
  size = 144,
  showUrl = true,
  className,
}: {
  url: string
  size?: number
  showUrl?: boolean
  className?: string
}) {
  const sizeClass = qrSizeClassMap[size] ?? 'size-36'
  const [absoluteUrl, setAbsoluteUrl] = useState(url)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setAbsoluteUrl(toAbsoluteUrl(url))
  }, [url])

  useEffect(() => {
    let active = true

    async function generateQr() {
      if (!absoluteUrl) {
        setQrDataUrl('')
        setError('Share URL is empty.')
        return
      }

      try {
        const dataUrl = await QRCode.toDataURL(absoluteUrl, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
        })

        if (!active) {
          return
        }

        setQrDataUrl(dataUrl)
        setError('')
      } catch {
        if (!active) {
          return
        }

        setQrDataUrl('')
        setError('Unable to generate QR code.')
      }
    }

    void generateQr()

    return () => {
      active = false
    }
  }, [absoluteUrl, size])

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-3',
        className,
      )}
    >
      <div className="rounded-md bg-white p-2 shadow-sm">
        {qrDataUrl
          ? (
            <Image
              src={qrDataUrl}
              alt="Share link QR code"
              width={size}
              height={size}
              className="block"
              unoptimized
            />
          )
          : (
            <div
              className={cn(
                'flex items-center justify-center rounded-md bg-muted px-3 text-center text-xs text-muted-foreground',
                sizeClass,
              )}
            >
              {error || 'Generating QR code...'}
            </div>
          )}
      </div>
      {showUrl && (
        <p className="max-w-56 truncate text-xs text-muted-foreground">
          {absoluteUrl}
        </p>
      )}
    </div>
  )
}
