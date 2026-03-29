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

import { minitool } from '@/lib/db/auth-schema'
import { createMinitool, updateMinitool } from './actions'

describe('minitool actions', () => {
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

  it('createMinitool inserts a new row for the authenticated user', async () => {
    await createMinitool({
      name: 'Reaction Wall',
      prompt: 'Collect audience mood reactions in real time.',
      componentCode: 'component-code',
      hostCode: 'host-code',
    })

    expect(mockDbInsert).toHaveBeenCalledWith(minitool)
    expect(mockInsertValues).toHaveBeenCalledWith({
      id: 'generated-id',
      userId: 'user-1',
      name: 'Reaction Wall',
      prompt: 'Collect audience mood reactions in real time.',
      componentCode: 'component-code',
      hostCode: 'host-code',
      isPublic: false,
    })
  })

  it('updateMinitool updates editable fields for the authenticated user', async () => {
    await updateMinitool({
      id: 'tool-1',
      name: 'Updated Minitool',
      componentCode: 'new component',
      hostCode: 'new host',
    })

    expect(mockDbUpdate).toHaveBeenCalledWith(minitool)
    expect(mockUpdateSet).toHaveBeenCalledWith({
      name: 'Updated Minitool',
      componentCode: 'new component',
      hostCode: 'new host',
    })

    const updatePayload = mockUpdateSet.mock.calls[0][0]
    expect(updatePayload).not.toHaveProperty('prompt')
    expect(updatePayload).not.toHaveProperty('isPublic')
    expect(mockEq).toHaveBeenCalledWith(minitool.id, 'tool-1')
    expect(mockEq).toHaveBeenCalledWith(minitool.userId, 'user-1')
    expect(mockAnd).toHaveBeenCalled()
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1)
  })

  it('updateMinitool rejects unauthenticated calls', async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(
      updateMinitool({
        id: 'tool-1',
        name: 'Updated Minitool',
        componentCode: 'new component',
        hostCode: 'new host',
      }),
    ).rejects.toThrow('Unauthorized')

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })
})
