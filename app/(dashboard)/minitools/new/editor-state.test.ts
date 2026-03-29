import { describe, expect, it } from 'vitest'

import {
  buildMinitoolSaveRequest,
  getMinitoolEditorState,
  toEditableMinitoolResult,
} from './editor-state'

const result = {
  suggestedName: 'Reaction Wall',
  componentCode: 'component-code',
  hostCode: 'host-code',
}

describe('minitool editor state', () => {
  it('maps a stored minitool into the editable AI result shape', () => {
    expect(
      toEditableMinitoolResult({
        name: 'Reaction Wall',
        componentCode: 'component-code',
        hostCode: 'host-code',
      }),
    ).toEqual(result)
  })

  it('builds a create payload when there is no existing record id', () => {
    expect(
      buildMinitoolSaveRequest({
        editId: null,
        name: 'Reaction Wall',
        prompt: 'Collect audience emoji reactions.',
        result,
      }),
    ).toEqual({
      mode: 'create',
      input: {
        name: 'Reaction Wall',
        prompt: 'Collect audience emoji reactions.',
        componentCode: 'component-code',
        hostCode: 'host-code',
      },
    })
  })

  it('builds an update payload for an existing minitool without mutating prompt', () => {
    expect(
      buildMinitoolSaveRequest({
        editId: 'tool-1',
        name: 'Updated Reaction Wall',
        prompt: 'Collect audience emoji reactions.',
        result,
      }),
    ).toEqual({
      mode: 'update',
      input: {
        id: 'tool-1',
        name: 'Updated Reaction Wall',
        componentCode: 'component-code',
        hostCode: 'host-code',
      },
    })
  })

  it('keeps iterate and save visible for existing saved minitools', () => {
    expect(
      getMinitoolEditorState({
        editId: 'tool-1',
        result,
      }),
    ).toMatchObject({
      isPromptLocked: true,
      showSaveAction: true,
      showIterateSection: true,
      title: 'Edit Minitool',
      saveLabel: 'Save Changes',
    })
  })
})
