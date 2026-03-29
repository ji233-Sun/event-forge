import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetSession,
  mockHeaders,
  mockInsertValues,
  mockUpdateSet,
  mockUpdateWhere,
  mockDbInsert,
  mockDbUpdate,
  mockEq,
  mockAnd,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
  mockInsertValues: vi.fn(),
  mockUpdateSet: vi.fn(),
  mockUpdateWhere: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockEq: vi.fn((left, right) => ({ type: 'eq', left, right })),
  mockAnd: vi.fn((...conditions) => ({ type: 'and', conditions })),
}))

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mockGetSession } } }))
vi.mock('next/headers', () => ({ headers: mockHeaders }))
vi.mock('@/lib/db', () => ({
  db: {
    insert: mockDbInsert,
    update: mockDbUpdate,
  },
}))
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm')

  return {
    ...actual,
    eq: mockEq,
    and: mockAnd,
  }
})

import { customQuestionType } from '@/lib/db/auth-schema'
import { createCustomType, updateCustomType } from './actions'

describe('question type actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertValues.mockResolvedValue(undefined)
    mockUpdateWhere.mockResolvedValue(undefined)
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
    mockDbInsert.mockReturnValue({ values: mockInsertValues })
    mockDbUpdate.mockReturnValue({ set: mockUpdateSet })
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('generated-id')
  })

  it('createCustomType inserts a new row for the authenticated user', async () => {
    await createCustomType({
      name: 'Energy Rating Slider',
      prompt: 'Collect energy level ratings with an optional comment.',
      formCode: 'form-code',
      displayCode: 'display-code',
      answerSchema: { type: 'object', properties: {} },
    })

    expect(mockDbInsert).toHaveBeenCalledWith(customQuestionType)
    expect(mockInsertValues).toHaveBeenCalledWith({
      id: 'generated-id',
      userId: 'user-1',
      name: 'Energy Rating Slider',
      description: null,
      prompt: 'Collect energy level ratings with an optional comment.',
      formCode: 'form-code',
      displayCode: 'display-code',
      answerSchema: { type: 'object', properties: {} },
    })
  })

  it('updateCustomType updates editable fields for the authenticated user', async () => {
    await updateCustomType({
      id: 'type-1',
      name: 'Updated Question Type',
      formCode: 'new form',
      displayCode: 'new display',
      answerSchema: { type: 'object', properties: {} },
    })

    expect(mockDbUpdate).toHaveBeenCalledWith(customQuestionType)
    expect(mockUpdateSet).toHaveBeenCalledWith({
      name: 'Updated Question Type',
      formCode: 'new form',
      displayCode: 'new display',
      answerSchema: { type: 'object', properties: {} },
    })

    const updatePayload = mockUpdateSet.mock.calls[0][0]
    expect(updatePayload).not.toHaveProperty('prompt')
    expect(mockEq).toHaveBeenCalledWith(customQuestionType.id, 'type-1')
    expect(mockEq).toHaveBeenCalledWith(customQuestionType.userId, 'user-1')
    expect(mockAnd).toHaveBeenCalled()
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1)
  })

  it('updateCustomType rejects unauthenticated calls', async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(
      updateCustomType({
        id: 'type-1',
        name: 'Updated Question Type',
        formCode: 'new form',
        displayCode: 'new display',
        answerSchema: { type: 'object', properties: {} },
      }),
    ).rejects.toThrow('Unauthorized')

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })
})
