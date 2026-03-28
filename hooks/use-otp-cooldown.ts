import { useEffect, useState } from 'react'

const COOLDOWN_SECONDS = 60

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
