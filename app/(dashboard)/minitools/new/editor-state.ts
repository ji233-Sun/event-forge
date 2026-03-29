import { getAgentTaskWizardState } from '@/components/agent-task/agent-task-state'
import type { CreationMode } from '@/lib/agent-tasks/types'
import type { GenerateMinitoolResult, MinitoolRecord } from '@/lib/minitool-runtime/types'

type MinitoolEditorStateInput = {
  editId: string | null
  result: GenerateMinitoolResult | null
  mode?: CreationMode
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

export function getMinitoolEditorState({
  editId,
  result,
  mode = 'built_in_ai',
}: MinitoolEditorStateInput) {
  return getAgentTaskWizardState({
    resourceKind: 'minitool',
    creationMode: mode,
    editId,
    hasResult: !!result,
  })
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
