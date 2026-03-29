'use client'

import { useState, useCallback, useEffect } from 'react'

// Factory: returns a useParticipantData hook bound to a specific minitool + visitor
export function createUseParticipantData(minitoolId: string, visitorId: string) {
  return function useParticipantData<T = unknown>() {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      fetch(`/api/t/${minitoolId}/participant?v=${encodeURIComponent(visitorId)}`)
        .then((r) => r.json())
        .then((j) => { setData((j.data as T) ?? null); setIsLoading(false) })
        .catch(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const save = useCallback(async (newData: T) => {
      await fetch(`/api/t/${minitoolId}/participant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, data: newData }),
      })
      setData(newData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { data, isLoading, save }
  }
}

// Factory: returns a useSharedData hook bound to a specific minitool
export function createUseSharedData(minitoolId: string) {
  return function useSharedData<T = unknown>() {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      fetch(`/api/t/${minitoolId}/shared`)
        .then((r) => r.json())
        .then((j) => { setData((j.data as T) ?? null); setIsLoading(false) })
        .catch(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const save = useCallback(async (newData: T) => {
      await fetch(`/api/t/${minitoolId}/shared`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData }),
      })
      setData(newData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { data, isLoading, save }
  }
}

// Preview stubs: no-op, return null data, discard all writes
export function createPreviewUseParticipantData() {
  return function useParticipantData<T = unknown>() {
    return {
      data: null as T | null,
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      save: async (_newData: T) => {},
    }
  }
}

export function createPreviewUseSharedData() {
  return function useSharedData<T = unknown>() {
    return {
      data: null as T | null,
      isLoading: false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      save: async (_newData: T) => {},
    }
  }
}
