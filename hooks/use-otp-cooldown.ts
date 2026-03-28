import { useEffect, useState } from 'react'

const COOLDOWN_SECONDS = 60

const OTP_ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: 'Incorrect code, please try again',
  OTP_EXPIRED: 'Code has expired, please request a new one',
  TOO_MANY_ATTEMPTS: 'Too many attempts, please request a new code',
}

export function getOtpErrorMessage(code?: string | null, fallback = 'Verification failed, please try again later') {
  return (code && OTP_ERROR_MESSAGES[code]) ?? fallback
}

export function useOtpCooldown() {
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  return {
    cooldown,
    canResend: cooldown === 0,
    startCooldown: () => setCooldown(COOLDOWN_SECONDS),
  }
}
