import { createHash, timingSafeEqual } from 'node:crypto'

export async function hashTaskToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createTaskToken({
  now,
  ttlMinutes,
}: {
  now: Date
  ttlMinutes: number
}) {
  const token = `eftask_${crypto.randomUUID()}`
  const tokenHash = await hashTaskToken(token)
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000)

  return { token, tokenHash, expiresAt }
}

export async function verifyTaskToken(token: string, tokenHash: string) {
  const hashedInput = await hashTaskToken(token)

  if (hashedInput.length !== tokenHash.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(hashedInput), Buffer.from(tokenHash))
}

export function isTaskTokenExpired({
  expiresAt,
  now,
}: {
  expiresAt: Date
  now: Date
}) {
  return now.getTime() > expiresAt.getTime()
}
