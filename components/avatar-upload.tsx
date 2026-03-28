'use client'

import { useRef, useState } from 'react'
import { IconCamera, IconLoader2 } from '@tabler/icons-react'

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        const scale = Math.max(maxSize / img.width, maxSize / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (maxSize - w) / 2, (maxSize - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AvatarUpload({
  image,
  name,
  onImageChange,
}: {
  image?: string | null
  name: string
  onImageChange?: (dataUrl: string) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > MAX_UPLOAD_BYTES) {
      alert('Image must be smaller than 10 MB')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const dataUrl = await resizeImage(file, 128)
      await onImageChange?.(dataUrl)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative shrink-0 cursor-pointer"
      aria-label="Change avatar"
    >
      {image ? (
        <img src={image} alt={name} className="h-24 w-24 rounded-full object-cover ring-4 ring-background shadow-lg" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground ring-4 ring-background shadow-lg">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
        {uploading ? (
          <IconLoader2 size={24} className="animate-spin text-white" />
        ) : (
          <IconCamera size={24} className="text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  )
}
