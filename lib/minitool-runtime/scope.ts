'use client'

import { QUESTION_RUNTIME_SCOPE } from '@/lib/question-runtime/scope'
import {
  createUseParticipantData,
  createUseSharedData,
  createPreviewUseParticipantData,
  createPreviewUseSharedData,
} from './hooks'

function createMinitoolHelpers(minitoolId: string, visitorId: string) {
  return {
    participant: {
      get: async () => {
        const r = await fetch(`/api/t/${minitoolId}/participant?v=${encodeURIComponent(visitorId)}`)
        const j = await r.json() as { data: unknown }
        return j.data ?? null
      },
      set: async (data: unknown) => {
        await fetch(`/api/t/${minitoolId}/participant`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId, data }),
        })
      },
    },
    shared: {
      get: async () => {
        const r = await fetch(`/api/t/${minitoolId}/shared`)
        const j = await r.json() as { data: unknown }
        return j.data ?? null
      },
      set: async (data: unknown) => {
        await fetch(`/api/t/${minitoolId}/shared`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        })
      },
    },
    participants: {
      list: async () => {
        const r = await fetch(`/api/t/${minitoolId}/participants`)
        const j = await r.json() as { participants: unknown[] }
        return j.participants ?? []
      },
    },
  }
}

function createPreviewHelpers() {
  return {
    participant: {
      get: async () => null,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: async (_data: unknown) => {},
    },
    shared: {
      get: async () => null,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: async (_data: unknown) => {},
    },
    participants: {
      list: async () => [],
    },
  }
}

export function createMinitoolScope(minitoolId: string, visitorId: string) {
  return {
    ...QUESTION_RUNTIME_SCOPE,
    useParticipantData: createUseParticipantData(minitoolId, visitorId),
    useSharedData: createUseSharedData(minitoolId),
    minitool: createMinitoolHelpers(minitoolId, visitorId),
    visitorId,
  }
}

export function createMinitoolPreviewScope(visitorId = 'preview-visitor') {
  return {
    ...QUESTION_RUNTIME_SCOPE,
    useParticipantData: createPreviewUseParticipantData(),
    useSharedData: createPreviewUseSharedData(),
    minitool: createPreviewHelpers(),
    visitorId,
  }
}
