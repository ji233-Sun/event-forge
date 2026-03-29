import { getAgentTaskWizardState } from '@/components/agent-task/agent-task-state'
import type { CreationMode } from '@/lib/agent-tasks/types'
import type {
  AnswerJsonSchema,
  CustomQuestionType,
  GenerateCustomTypeResult,
} from '@/lib/question-runtime/types'

type QuestionTypeEditorStateInput = {
  editId: string | null
  result: GenerateCustomTypeResult | null
  mode?: CreationMode
}

type QuestionTypeSaveRequestInput = {
  editId: string | null
  name: string
  prompt: string
  result: GenerateCustomTypeResult
}

export function toEditableQuestionTypeResult(
  type: Pick<CustomQuestionType, 'name' | 'formCode' | 'displayCode' | 'answerSchema'>,
): GenerateCustomTypeResult {
  return {
    suggestedName: type.name,
    formCode: type.formCode,
    displayCode: type.displayCode,
    answerSchema: type.answerSchema,
  }
}

export function getQuestionTypeEditorState({
  editId,
  result,
  mode = 'built_in_ai',
}: QuestionTypeEditorStateInput) {
  return getAgentTaskWizardState({
    resourceKind: 'question_type',
    creationMode: mode,
    editId,
    hasResult: !!result,
  })
}

export function buildQuestionTypeSaveRequest({
  editId,
  name,
  prompt,
  result,
}: QuestionTypeSaveRequestInput):
  | {
      mode: 'create'
      input: {
        name: string
        prompt: string
        formCode: string
        displayCode: string
        answerSchema: AnswerJsonSchema
      }
    }
  | {
      mode: 'update'
      input: {
        id: string
        name: string
        formCode: string
        displayCode: string
        answerSchema: AnswerJsonSchema
      }
    } {
  if (editId) {
    return {
      mode: 'update',
      input: {
        id: editId,
        name,
        formCode: result.formCode,
        displayCode: result.displayCode,
        answerSchema: result.answerSchema,
      },
    }
  }

  return {
    mode: 'create',
    input: {
      name,
      prompt,
      formCode: result.formCode,
      displayCode: result.displayCode,
      answerSchema: result.answerSchema,
    },
  }
}
