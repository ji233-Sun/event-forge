import { describe, expect, it } from 'vitest'
import {
  EVENTFORGE_SKILL_URL,
  buildAgentInstructions,
  getOutputContract,
} from '../skill'

describe('agent task skill helpers', () => {
  it('returns the question type output contract', () => {
    expect(getOutputContract('question_type')).toEqual({
      suggestedName: 'string',
      formCode: 'string',
      displayCode: 'string',
      answerSchema: 'object',
    })
  })

  it('builds copy-ready instructions for an external agent', () => {
    const text = buildAgentInstructions({
      taskId: 'task-1',
      skillUrl: EVENTFORGE_SKILL_URL,
      readUrl: '/api/agent-tasks/task-1/agent',
      submitUrl: '/api/agent-tasks/task-1/agent/submission',
      token: 'eftask_123',
      resourceKind: 'minitool',
      turnKind: 'create',
    })

    expect(text).toContain('Read the EventForge skill')
    expect(text).toContain('eftask_123')
    expect(text).toContain('/api/agent-tasks/task-1/agent')
    expect(text).toContain('/api/agent-tasks/task-1/agent/submission')
    expect(text).toContain('minitool')
  })
})
