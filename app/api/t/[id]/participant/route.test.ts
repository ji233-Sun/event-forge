import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      minitool: { findFirst: vi.fn() },
      minitoolParticipant: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/db/auth-schema', () => ({
  minitool: { id: 'minitool_id_col' },
  minitoolParticipant: { minitoolId: 'minitool_id_col', visitorId: 'visitor_id_col' },
}))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }))

import { GET, PUT } from './route'

describe('GET /api/t/[id]/participant', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when visitorId is missing', async () => {
    const res = await GET(
      new Request('http://localhost/api/t/tool1/participant'),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when minitool not found', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/t/bad/participant?v=visitor1'),
      { params: Promise.resolve({ id: 'bad' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns { data: null } when participant has no data yet', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 'tool1' })
    mockDb.query.minitoolParticipant.findFirst.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/t/tool1/participant?v=visitor1'),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: null })
  })

  it('returns { data: ... } when participant exists', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 'tool1' })
    mockDb.query.minitoolParticipant.findFirst.mockResolvedValue({ data: { score: 5 } })
    const res = await GET(
      new Request('http://localhost/api/t/tool1/participant?v=visitor1'),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { score: 5 } })
  })
})

describe('PUT /api/t/[id]/participant', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns 400 when body is invalid JSON', async () => {
    const res = await PUT(
      new Request('http://localhost/api/t/tool1/participant', { method: 'PUT', body: 'bad' }),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when visitorId is missing', async () => {
    const res = await PUT(
      new Request('http://localhost/api/t/tool1/participant', {
        method: 'PUT',
        body: JSON.stringify({ data: { score: 5 } }),
      }),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when data is not an object', async () => {
    const res = await PUT(
      new Request('http://localhost/api/t/tool1/participant', {
        method: 'PUT',
        body: JSON.stringify({ visitorId: 'v1', data: [1, 2, 3] }),
      }),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when minitool not found', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue(null)
    const res = await PUT(
      new Request('http://localhost/api/t/bad/participant', {
        method: 'PUT',
        body: JSON.stringify({ visitorId: 'v1', data: { score: 5 } }),
      }),
      { params: Promise.resolve({ id: 'bad' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns { ok: true } and upserts on valid input', async () => {
    mockDb.query.minitool.findFirst.mockResolvedValue({ id: 'tool1' })
    const mockChain = { values: vi.fn().mockReturnThis(), onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) }
    mockDb.insert.mockReturnValue(mockChain)

    const res = await PUT(
      new Request('http://localhost/api/t/tool1/participant', {
        method: 'PUT',
        body: JSON.stringify({ visitorId: 'v1', data: { score: 5 } }),
      }),
      { params: Promise.resolve({ id: 'tool1' }) },
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(mockDb.insert).toHaveBeenCalledTimes(1)
    expect(mockChain.onConflictDoUpdate).toHaveBeenCalledTimes(1)
  })
})
