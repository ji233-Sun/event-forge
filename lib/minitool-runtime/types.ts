import type { CreationMode } from '@/lib/agent-tasks/types'

export type GenerateMinitoolResult = {
  suggestedName: string
  componentCode: string  // audience component, noInline JSX string
  hostCode: string       // host view component, noInline JSX string
}

export type MinitoolRecord = {
  id: string
  userId: string
  name: string
  prompt: string
  componentCode: string
  hostCode: string
  isPublic: boolean
  creationMode: CreationMode
  agentTaskId: string | null
  createdAt: Date
  updatedAt: Date
}

export type MinitoolParticipantRow = {
  visitorId: string
  data: Record<string, unknown>
  updatedAt: Date
}
