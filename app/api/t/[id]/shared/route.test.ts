import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      minitool: { findFirst: vi.fn() },
      minitoolShared: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/db/auth-schema', () => ({
  minitool: { id: 'id_col' },
  minitoolShared: { minitoolId: 'minitool_id_col' },
}))
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }))

import { GET, PUT } from './route'

describe('GET /api/t/[id]/shared', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 404 when minitool not found', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ id: 'bad' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns { data: null } when no shared state yet', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 't1' })
    mockDb.query.minitoolShared.findFirst.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: null })
  })

  it('returns existing shared data', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 't1' })
    mockDb.query.minitoolShared.findFirst.mockResolvedValue({ data: { votes: 42 } })
    const res = await GET(
      new Request('http://localhost'),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { votes: 42 } })
  })
})

describe('PUT /api/t/[id]/shared', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when data is an array', async () => {
    const res = await PUT(
      new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ data: [1, 2] }) }),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when minitool not found', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue(null)
    const res = await PUT(
      new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ data: { votes: 1 } }) }),
      { params: Promise.resolve({ id: 'bad' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns { ok: true } and upserts on valid input', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 't1' })
    const mockChain = { values: vi.fn().mockReturnThis(), onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) }
    mockDb.insert.mockReturnValue(mockChain)

    const res = await PUT(
      new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ data: { votes: 1 } }) }),
      { params: Promise.resolve({ id: 't1' }) },
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })
})
