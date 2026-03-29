import { describe, expect, it } from 'vitest'

import {
  getAgentTaskCopy,
  getAgentTaskWizardState,
} from './agent-task-state'

describe('agent task state', () => {
  it('provides question type specific copy for the shared wizard', () => {
    expect(getAgentTaskCopy('question_type')).toMatchObject({
      singularName: 'Question Type',
      collectionName: 'question types',
      promptLabel: 'What should this question collect?',
      identityLabel: 'Type Name',
      saveCreateLabel: 'Save to Library',
    })
  })

  it('builds built-in AI create state without the agent step', () => {
    expect(
      getAgentTaskWizardState({
        resourceKind: 'minitool',
        creationMode: 'built_in_ai',
        editId: null,
        hasResult: false,
      }),
    ).toMatchObject({
      title: 'Create Minitool',
      isPromptLocked: false,
      showModeSwitch: true,
      showAgentStep: false,
      showIterateSection: false,
      showSaveAction: false,
      primaryActionLabel: 'Generate with AI',
      steps: [
        { id: 'prompt', title: '1. Prompt', status: 'current' },
        { id: 'identity', title: '2. Name', status: 'upcoming' },
      ],
    })
  })

  it('builds my agent create state with an explicit agent handoff step', () => {
    expect(
      getAgentTaskWizardState({
        resourceKind: 'question_type',
        creationMode: 'my_agent',
        editId: null,
        hasResult: false,
      }),
    ).toMatchObject({
      title: 'Create Question Type',
      showModeSwitch: true,
      showAgentStep: true,
      primaryActionLabel: 'Prepare Agent Task',
      modeDescription:
        'Hand off the prompt to your external agent with the shared EventForge skill.',
      steps: [
        { id: 'prompt', title: '1. Prompt', status: 'current' },
        { id: 'agent', title: '2. Agent Task', status: 'upcoming' },
        { id: 'identity', title: '3. Identity', status: 'upcoming' },
      ],
    })
  })

  it('locks the prompt and enables iteration once a result exists', () => {
    expect(
      getAgentTaskWizardState({
        resourceKind: 'question_type',
        creationMode: 'my_agent',
        editId: null,
        hasResult: true,
      }),
    ).toMatchObject({
      isPromptLocked: true,
      showAgentStep: true,
      showIterateSection: true,
      showSaveAction: true,
      steps: [
        { id: 'prompt', status: 'complete' },
        { id: 'agent', status: 'complete' },
        { id: 'iterate', status: 'current' },
        { id: 'identity', status: 'complete' },
      ],
    })
  })

  it('disables mode switching while editing an existing saved resource', () => {
    expect(
      getAgentTaskWizardState({
        resourceKind: 'minitool',
        creationMode: 'built_in_ai',
        editId: 'tool-1',
        hasResult: true,
      }),
    ).toMatchObject({
      title: 'Edit Minitool',
      description: 'Refine your saved minitool and save updates to the same live tool.',
      showModeSwitch: false,
      isPromptLocked: true,
      saveLabel: 'Save Changes',
      lockedPromptMessage:
        'The original prompt is read-only. Use iteration feedback below to refine this saved minitool.',
    })
  })
})
