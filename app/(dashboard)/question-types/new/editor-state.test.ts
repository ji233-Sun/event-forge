import { describe, expect, it } from 'vitest'

import type { GenerateCustomTypeResult } from '@/lib/question-runtime/types'
import {
  buildQuestionTypeSaveRequest,
  getQuestionTypeEditorState,
} from './editor-state'

const result: GenerateCustomTypeResult = {
  suggestedName: 'Energy Rating Slider',
  formCode: 'form-code',
  displayCode: 'display-code',
  answerSchema: {
    type: 'object',
    properties: {
      score: { type: 'number' },
    },
  },
}

describe('question type editor state', () => {
  it('builds a create payload when there is no existing record id', () => {
    expect(
      buildQuestionTypeSaveRequest({
        editId: null,
        name: 'Energy Rating Slider',
        prompt: 'Collect audience energy scores.',
        result,
      }),
    ).toEqual({
      mode: 'create',
      input: {
        name: 'Energy Rating Slider',
        prompt: 'Collect audience energy scores.',
        formCode: 'form-code',
        displayCode: 'display-code',
        answerSchema: result.answerSchema,
      },
    })
  })

  it('builds an update payload for an existing record without mutating prompt', () => {
    expect(
      buildQuestionTypeSaveRequest({
        editId: 'type-1',
        name: 'Updated Question Type',
        prompt: 'Collect audience energy scores.',
        result,
      }),
    ).toEqual({
      mode: 'update',
      input: {
        id: 'type-1',
        name: 'Updated Question Type',
        formCode: 'form-code',
        displayCode: 'display-code',
        answerSchema: result.answerSchema,
      },
    })
  })

  it('keeps iterate and save visible for existing saved question types', () => {
    expect(
      getQuestionTypeEditorState({
        editId: 'type-1',
        result,
      }),
    ).toMatchObject({
      isPromptLocked: true,
      showSaveAction: true,
      showIterateSection: true,
      title: 'Edit Question Type',
      saveLabel: 'Save Changes',
    })
  })
})
