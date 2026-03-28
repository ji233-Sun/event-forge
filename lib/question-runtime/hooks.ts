'use client'

import { useState, useCallback } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export function useChat(options?: { systemPrompt?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const send = useCallback(async (content: string) => {
    const nextMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/question-runtime/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, systemPrompt: options?.systemPrompt }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Chat failed')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.text as string }])
    } finally {
      setIsLoading(false)
    }
  }, [messages, options?.systemPrompt])

  return { messages, send, isLoading }
}

export function useImageGen() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (prompt: string): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/question-runtime/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Image generation failed.')
      setImageUrl(data.imageUrl)
      return data.imageUrl as string
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Image generation failed.'
      setError(msg)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { imageUrl, isGenerating, error, generate }
}

export function useMusicGen() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (params: {
    prompt: string
    durationSeconds?: number
    mood?: string
    tempo?: string
    instrumentation?: string
  }): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/question-runtime/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Music generation failed.')
      setAudioUrl(data.audioUrl)
      return data.audioUrl as string
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Music generation failed.'
      setError(msg)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { audioUrl, isGenerating, error, generate }
}

export function useFileUpload(options?: { maxMb?: number }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<string | null> => {
    const maxBytes = (options?.maxMb ?? 10) * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`File must be ${options?.maxMb ?? 10}MB or smaller.`)
      return null
    }
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/question-runtime/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed.')
      setFileUrl(data.fileUrl)
      return data.fileUrl as string
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed.'
      setError(msg)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [options?.maxMb])

  return { fileUrl, isUploading, error, upload }
}
