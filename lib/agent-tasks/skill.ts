import type { AgentTaskOutputContract } from './contracts'
import type { AgentTaskResourceKind, AgentTaskTurnKind } from './types'

export const EVENTFORGE_SKILL_URL = '/eventforge-skill.md'

export function getOutputContract(
  resourceKind: AgentTaskResourceKind,
): AgentTaskOutputContract {
  if (resourceKind === 'question_type') {
    return {
      suggestedName: 'string',
      formCode: 'string',
      displayCode: 'string',
      answerSchema: 'object',
    }
  }

  return {
    suggestedName: 'string',
    componentCode: 'string',
    hostCode: 'string',
  }
}

export function buildAgentInstructions({
  taskId,
  skillUrl,
  readUrl,
  submitUrl,
  token,
  resourceKind,
  turnKind,
}: {
  taskId: string
  skillUrl: string
  readUrl: string
  submitUrl: string
  token: string
  resourceKind: AgentTaskResourceKind
  turnKind: AgentTaskTurnKind
}) {
  return [
    'Read the EventForge skill before doing anything else.',
    `Skill URL: ${skillUrl}`,
    `Task ID: ${taskId}`,
    `Resource kind: ${resourceKind}`,
    `Turn kind: ${turnKind}`,
    `Read task: ${readUrl}`,
    `Submit result: ${submitUrl}`,
    `Bearer token: ${token}`,
    'Use the read endpoint to fetch the full task payload and output contract.',
    'Return only a valid EventForge draft payload to the submit endpoint.',
  ].join('\n')
}
