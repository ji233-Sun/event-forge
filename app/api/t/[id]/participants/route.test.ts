import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession, mockHeaders, mockDb } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
  mockDb: {
    query: {
      minitool: { findFirst: vi.fn() },
      minitoolParticipant: { findMany: vi.fn() },
    },
  },
}))

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: mockGetSession } } }))
vi.mock('next/headers', () => ({ headers: mockHeaders }))
vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/db/auth-schema', () => ({
  minitool: { id: 'id_col', userId: 'user_id_col' },
  minitoolParticipant: { minitoolId: 'minitool_id_col' },
}))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }))

import { GET } from './route'

describe('GET /api/t/[id]/participants', () => {
  beforeEach(() => mockHeaders.mockResolvedValue(new Headers()))
  afterEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 when minitool not owned by user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockDb.query.minitool.findFirst.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns participants list when owned', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } })
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 't1' })
    mockDb.query.minitoolParticipant.findMany.mockResolvedValue([
      { visitorId: 'v1', data: { score: 5 }, updatedAt: new Date('2026-01-01') },
    ])
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.participants).toHaveLength(1)
    expect(json.participants[0].visitorId).toBe('v1')
  })
})
