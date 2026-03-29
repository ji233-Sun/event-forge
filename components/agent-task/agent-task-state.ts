import type {
  AgentTaskResourceKind,
  CreationMode,
} from '@/lib/agent-tasks/types'

export type AgentTaskWizardStepId =
  | 'prompt'
  | 'agent'
  | 'iterate'
  | 'identity'

export type AgentTaskWizardStepStatus = 'upcoming' | 'current' | 'complete'

export type AgentTaskCopy = {
  singularName: string
  collectionName: string
  titleCreate: string
  titleEdit: string
  descriptionCreate: string
  descriptionCreateWithAgent: string
  descriptionEdit: string
  promptLabel: string
  promptPlaceholder: string
  identityLabel: string
  identityPlaceholder: string
  saveCreateLabel: string
  saveEditLabel: string
  lockedPromptMessageCreate: string
  lockedPromptMessageCreateWithAgent: string
  lockedPromptMessageEdit: string
  identityStepTitle: string
}

export type AgentTaskWizardStep = {
  id: AgentTaskWizardStepId
  title: string
  description: string
  status: AgentTaskWizardStepStatus
}

export type AgentTaskWizardState = {
  title: string
  description: string
  promptLabel: string
  promptPlaceholder: string
  identityLabel: string
  identityPlaceholder: string
  identityStepTitle: string
  primaryActionLabel: string
  saveLabel: string
  lockedPromptMessage: string
  modeLabel: string
  modeDescription: string
  previewTitle: string
  previewEmptyTitle: string
  previewEmptyDescription: string
  showModeSwitch: boolean
  showAgentStep: boolean
  showIterateSection: boolean
  showIdentitySection: boolean
  showSaveAction: boolean
  isEditing: boolean
  isPromptLocked: boolean
  steps: AgentTaskWizardStep[]
}

type AgentTaskWizardStateInput = {
  resourceKind: AgentTaskResourceKind
  creationMode: CreationMode
  editId: string | null
  hasResult: boolean
}

const RESOURCE_COPY: Record<AgentTaskResourceKind, AgentTaskCopy> = {
  question_type: {
    singularName: 'Question Type',
    collectionName: 'question types',
    titleCreate: 'Create Question Type',
    titleEdit: 'Edit Question Type',
    descriptionCreate: 'Describe your vision, AI handles the rest.',
    descriptionCreateWithAgent:
      'Hand off the prompt to your external agent with the shared EventForge skill.',
    descriptionEdit:
      'Refine your saved custom question type and save updates to the same library item.',
    promptLabel: 'What should this question collect?',
    promptPlaceholder:
      'e.g. A visual slider for rating energy levels with a comment box...',
    identityLabel: 'Type Name',
    identityPlaceholder: 'e.g. Energy Rating Slider',
    saveCreateLabel: 'Save to Library',
    saveEditLabel: 'Save Changes',
    lockedPromptMessageCreate:
      'The initial prompt is locked after generation. Use iteration feedback below to request bug fixes or improvements based on the current result.',
    lockedPromptMessageCreateWithAgent:
      'The initial brief is locked after your agent returns a draft. Use iteration feedback below to request fixes or follow-up improvements.',
    lockedPromptMessageEdit:
      'The original prompt is read-only. Use iteration feedback below to refine this saved question type.',
    identityStepTitle: '3. Identity',
  },
  minitool: {
    singularName: 'Minitool',
    collectionName: 'minitools',
    titleCreate: 'Create Minitool',
    titleEdit: 'Edit Minitool',
    descriptionCreate: 'Describe your tool, AI handles the rest.',
    descriptionCreateWithAgent:
      'Hand off the prompt to your external agent with the shared EventForge skill.',
    descriptionEdit:
      'Refine your saved minitool and save updates to the same live tool.',
    promptLabel: 'What should this tool do?',
    promptPlaceholder:
      'e.g. A live emoji reaction wall where audience members pick their mood...',
    identityLabel: 'Minitool Name',
    identityPlaceholder: 'e.g. Emoji Reaction Wall',
    saveCreateLabel: 'Save Minitool',
    saveEditLabel: 'Save Changes',
    lockedPromptMessageCreate:
      'The initial prompt is locked after generation. Use iteration feedback below to request bug fixes or improvements based on the current result.',
    lockedPromptMessageCreateWithAgent:
      'The initial brief is locked after your agent returns a draft. Use iteration feedback below to request fixes or follow-up improvements.',
    lockedPromptMessageEdit:
      'The original prompt is read-only. Use iteration feedback below to refine this saved minitool.',
    identityStepTitle: '3. Name',
  },
}

export function getAgentTaskCopy(resourceKind: AgentTaskResourceKind) {
  return RESOURCE_COPY[resourceKind]
}

export function getAgentTaskWizardState({
  resourceKind,
  creationMode,
  editId,
  hasResult,
}: AgentTaskWizardStateInput): AgentTaskWizardState {
  const copy = getAgentTaskCopy(resourceKind)
  const isEditing = !!editId
  const showAgentStep = creationMode === 'my_agent'
  const showModeSwitch = !isEditing
  const showIterateSection = hasResult
  const showIdentitySection = hasResult
  const showSaveAction = hasResult
  const isPromptLocked = hasResult || isEditing

  const steps = buildSteps({
    creationMode,
    identityStepTitle: copy.identityStepTitle,
    hasResult,
    showAgentStep,
  })

  return {
    title: isEditing ? copy.titleEdit : copy.titleCreate,
    description: isEditing
      ? copy.descriptionEdit
      : creationMode === 'my_agent'
        ? copy.descriptionCreateWithAgent
        : copy.descriptionCreate,
    promptLabel: copy.promptLabel,
    promptPlaceholder: copy.promptPlaceholder,
    identityLabel: copy.identityLabel,
    identityPlaceholder: copy.identityPlaceholder,
    identityStepTitle: copy.identityStepTitle,
    primaryActionLabel: hasResult
      ? creationMode === 'my_agent'
        ? 'Refresh Agent Task'
        : 'Refine with AI'
      : creationMode === 'my_agent'
        ? 'Prepare Agent Task'
        : 'Generate with AI',
    saveLabel: isEditing ? copy.saveEditLabel : copy.saveCreateLabel,
    lockedPromptMessage: isEditing
      ? copy.lockedPromptMessageEdit
      : creationMode === 'my_agent'
        ? copy.lockedPromptMessageCreateWithAgent
        : copy.lockedPromptMessageCreate,
    modeLabel:
      creationMode === 'my_agent' ? 'My Agent' : 'Built-in AI',
    modeDescription:
      creationMode === 'my_agent'
        ? 'Hand off the prompt to your external agent with the shared EventForge skill.'
        : 'Generate the first draft directly inside EventForge with the built-in AI flow.',
    previewTitle: `${copy.singularName} Preview`,
    previewEmptyTitle: `No ${copy.singularName.toLowerCase()} draft yet`,
    previewEmptyDescription:
      creationMode === 'my_agent'
        ? `Prepare an agent task to receive the first ${copy.singularName.toLowerCase()} draft here.`
        : `Generate a draft to review the ${copy.singularName.toLowerCase()} preview here.`,
    showModeSwitch,
    showAgentStep,
    showIterateSection,
    showIdentitySection,
    showSaveAction,
    isEditing,
    isPromptLocked,
    steps,
  }
}

function buildSteps({
  creationMode,
  identityStepTitle,
  hasResult,
  showAgentStep,
}: {
  creationMode: CreationMode
  identityStepTitle: string
  hasResult: boolean
  showAgentStep: boolean
}): AgentTaskWizardStep[] {
  if (!hasResult) {
    const initialSteps: AgentTaskWizardStep[] = [
      {
        id: 'prompt',
        title: '1. Prompt',
        description:
          creationMode === 'my_agent'
            ? 'Define the brief for your external agent.'
            : 'Describe the first draft you want EventForge to generate.',
        status: 'current',
      },
    ]

    if (showAgentStep) {
      initialSteps.push({
        id: 'agent',
        title: '2. Agent Task',
        description: 'Copy the skill instructions and hand off the task.',
        status: 'upcoming',
      })
    }

    initialSteps.push({
      id: 'identity',
      title: showAgentStep ? identityStepTitle : '2. Name',
      description: 'Review the final name before saving.',
      status: 'upcoming',
    })

    return initialSteps
  }

  const completedFlow: AgentTaskWizardStep[] = [
    {
      id: 'prompt',
      title: '1. Prompt',
      description: 'The original brief is locked to preserve traceability.',
      status: 'complete',
    },
  ]

  if (showAgentStep) {
    completedFlow.push({
      id: 'agent',
      title: '2. Agent Task',
      description: 'The external agent returned a draft for review.',
      status: 'complete',
    })
  }

  completedFlow.push({
    id: 'iterate',
    title: showAgentStep ? '3. Iterate' : '2. Iterate',
    description: 'Refine bugs, UX details, or follow-up changes.',
    status: 'current',
  })

  completedFlow.push({
    id: 'identity',
    title: showAgentStep ? '4. Identity' : identityStepTitle,
    description: 'Confirm the draft name before saving.',
    status: 'complete',
  })

  return completedFlow
}
