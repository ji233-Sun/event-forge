import { useEffect, useState } from 'react'

const COOLDOWN_SECONDS = 60

const OTP_ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: '验证码不正确，请重新输入',
  OTP_EXPIRED: '验证码已过期，请重新发送',
  TOO_MANY_ATTEMPTS: '错误次数过多，请重新获取验证码',
}

export function getOtpErrorMessage(code?: string | null, fallback = '验证失败，请稍后重试') {
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
