import { describe, expect, it } from 'vitest'
import {
  createTaskToken,
  hashTaskToken,
  isTaskTokenExpired,
  verifyTaskToken,
} from '../token'

describe('agent task token helpers', () => {
  it('creates a raw token and a different hash', async () => {
    const issuedAt = new Date('2026-03-29T08:00:00.000Z')
    const result = await createTaskToken({ now: issuedAt, ttlMinutes: 30 })

    expect(result.token).toMatch(/^eftask_/)
    expect(result.tokenHash).not.toBe(result.token)
    expect(result.expiresAt.toISOString()).toBe('2026-03-29T08:30:00.000Z')
  })

  it('verifies the original token against its hash', async () => {
    const { token, tokenHash } = await createTaskToken({
      now: new Date('2026-03-29T08:00:00.000Z'),
      ttlMinutes: 30,
    })

    await expect(verifyTaskToken(token, tokenHash)).resolves.toBe(true)
    await expect(verifyTaskToken(`${token}-bad`, tokenHash)).resolves.toBe(false)
  })

  it('detects expiry using the supplied clock', () => {
    expect(
      isTaskTokenExpired({
        expiresAt: new Date('2026-03-29T08:30:00.000Z'),
        now: new Date('2026-03-29T08:31:00.000Z'),
      }),
    ).toBe(true)
  })

  it('produces stable hashes for the same token', async () => {
    const hash1 = await hashTaskToken('eftask_same-token')
    const hash2 = await hashTaskToken('eftask_same-token')

    expect(hash1).toBe(hash2)
  })
})
