import type {
  AnswerJsonSchema,
  CustomQuestionType,
  GenerateCustomTypeResult,
} from '@/lib/question-runtime/types'

type QuestionTypeEditorStateInput = {
  editId: string | null
  result: GenerateCustomTypeResult | null
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
}: QuestionTypeEditorStateInput) {
  const isEditing = !!editId
  const hasResult = !!result

  return {
    isEditing,
    isPromptLocked: hasResult || isEditing,
    showSaveAction: hasResult,
    showIterateSection: hasResult,
    title: isEditing ? 'Edit Question Type' : 'Create Question Type',
    description: isEditing
      ? 'Refine your saved custom question type and save updates to the same library item.'
      : 'Describe your vision, AI handles the rest.',
    lockedPromptMessage: isEditing
      ? 'The original prompt is read-only. Use iteration feedback below to refine this saved question type.'
      : 'The initial prompt is locked after generation. Use iteration feedback below to request bug fixes or improvements based on the current result.',
    saveLabel: isEditing ? 'Save Changes' : 'Save to Library',
    identityStepTitle: '3. Identity',
  }
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
