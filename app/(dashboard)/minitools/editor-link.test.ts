import { describe, expect, it } from 'vitest'

import { getMinitoolEditorHref } from './editor-link'

describe('getMinitoolEditorHref', () => {
  it('builds the edit route for an existing minitool', () => {
    expect(getMinitoolEditorHref('tool-1')).toBe('/minitools/new?id=tool-1')
  })
})
