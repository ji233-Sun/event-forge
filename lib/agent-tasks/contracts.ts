import type { AgentTaskResourceKind, AgentTaskTurnKind } from './types'

export type QuestionTypeDraft = {
  suggestedName: string
  formCode: string
  displayCode: string
  answerSchema: Record<string, unknown>
}

export type MinitoolDraft = {
  suggestedName: string
  componentCode: string
  hostCode: string
}

export type AgentTaskDraft = QuestionTypeDraft | MinitoolDraft

export type AgentTaskOutputContract = Record<string, string>

export type AgentTaskReadResponse = {
  task: {
    id: string
    resourceKind: AgentTaskResourceKind
    turnKind: AgentTaskTurnKind
    skillVersion: 'v1'
  }
  brief: {
    originalPrompt: string
    iterationFeedback: string | null
    currentDraft: AgentTaskDraft | null
  }
  outputContract: AgentTaskOutputContract
  rules: string[]
}
