import type { GenerateMinitoolResult, MinitoolRecord } from '@/lib/minitool-runtime/types'

type MinitoolEditorStateInput = {
  editId: string | null
  result: GenerateMinitoolResult | null
}

type MinitoolSaveRequestInput = {
  editId: string | null
  name: string
  prompt: string
  result: GenerateMinitoolResult
}

export function toEditableMinitoolResult(
  tool: Pick<MinitoolRecord, 'name' | 'componentCode' | 'hostCode'>,
): GenerateMinitoolResult {
  return {
    suggestedName: tool.name,
    componentCode: tool.componentCode,
    hostCode: tool.hostCode,
  }
}

export function getMinitoolEditorState({ editId, result }: MinitoolEditorStateInput) {
  const isEditing = !!editId
  const hasResult = !!result

  return {
    isEditing,
    isPromptLocked: hasResult || isEditing,
    showSaveAction: hasResult,
    showIterateSection: hasResult,
    title: isEditing ? 'Edit Minitool' : 'Create Minitool',
    description: isEditing
      ? 'Refine your saved minitool and save updates to the same live tool.'
      : 'Describe your tool — AI handles the rest.',
    lockedPromptMessage: isEditing
      ? 'The original prompt is read-only. Use iteration feedback below to refine this saved minitool.'
      : 'The initial prompt is locked after generation. Use iteration feedback below to request bug fixes or improvements based on the current result.',
    saveLabel: isEditing ? 'Save Changes' : 'Save Minitool',
    nameStepTitle: '3. Name',
  }
}

export function buildMinitoolSaveRequest({
  editId,
  name,
  prompt,
  result,
}: MinitoolSaveRequestInput):
  | {
      mode: 'create'
      input: {
        name: string
        prompt: string
        componentCode: string
        hostCode: string
      }
    }
  | {
      mode: 'update'
      input: {
        id: string
        name: string
        componentCode: string
        hostCode: string
      }
    } {
  if (editId) {
    return {
      mode: 'update',
      input: {
        id: editId,
        name,
        componentCode: result.componentCode,
        hostCode: result.hostCode,
      },
    }
  }

  return {
    mode: 'create',
    input: {
      name,
      prompt,
      componentCode: result.componentCode,
      hostCode: result.hostCode,
    },
  }
}
