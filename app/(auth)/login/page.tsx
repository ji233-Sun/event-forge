'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useOtpCooldown } from '@/hooks/use-otp-cooldown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  IconAlertCircle,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from '@tabler/icons-react'

type Step = 'form' | 'verify'

export default function LoginPage() {
  const router = useRouter()
  const { cooldown, canResend, startCooldown } = useOtpCooldown()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await authClient.signIn.email({ email, password })

    if (!error) {
      router.push('/')
      router.refresh()
      return
    }

    // 邮箱未验证 → 自动发 OTP 跳转验证步骤
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification',
      })
      setLoading(false)
      if (otpError) {
        setError(otpError.message ?? '验证码发送失败，请稍后重试')
        return
      }
      startCooldown()
      setInfo('验证码已发送，请查收邮件')
      setStep('verify')
      return
    }

    setLoading(false)
    setError(error.message ?? '登录失败，请检查邮箱和密码')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp })

    if (verifyError) {
      setLoading(false)
      setError(verifyError.message ?? '验证码错误或已过期，请重新发送')
      return
    }

    // 邮箱已验证，重新登录建立会话
    const { error: signInError } = await authClient.signIn.email({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message ?? '登录失败，请重试')
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleResend() {
    setError('')
    setInfo('')
    setLoading(true)

    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message ?? '发送失败，请稍后重试')
      return
    }

    startCooldown()
    setInfo('验证码已重新发送')
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-[400px] border-border/50 shadow-xl shadow-primary/5 transition-all">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">验证邮箱</CardTitle>
          <CardDescription>验证码已发送至 {email}</CardDescription>
        </CardHeader>

        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            {error && <ErrorAlert message={error} />}
            {info && !error && <InfoAlert message={info} />}

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">验证码</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="请输入 6 位数字验证码"
                maxLength={6}
                required
                autoFocus
                className="h-11 text-center text-lg tracking-[0.5em] font-bold focus-visible:ring-primary/20"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-2">
            <Button
              type="submit"
              className="h-11 w-full text-base font-medium shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading
                ? <><IconLoader2 size={18} className="animate-spin mr-2" />验证中...</>
                : '验证并登录'}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              disabled={!canResend || loading}
              onClick={handleResend}
            >
              {canResend ? '没收到邮件？重新发送' : `重新发送（${cooldown}s）`}
            </button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-[400px] border-border/50 shadow-xl shadow-primary/5 transition-all">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">欢迎回来</CardTitle>
        <CardDescription>请登录你的账户以访问 EventForge</CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              className="h-11 transition-all focus-visible:ring-primary/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative group">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="输入你的密码"
                autoComplete="current-password"
                required
                className="h-11 pr-11 transition-all focus-visible:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground group-focus-within:text-foreground"
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-2">
          <Button
            type="submit"
            className="h-11 w-full text-base font-medium shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading
              ? <><IconLoader2 size={18} className="animate-spin mr-2" />正在登录...</>
              : '登录'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            还没有账户？{' '}
            <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              立即免费注册
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 animate-in fade-in zoom-in-95 duration-200"
    >
      <IconAlertCircle size={18} className="shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  )
}

function InfoAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400 border border-green-500/20 animate-in fade-in zoom-in-95 duration-200">
      <IconCircleCheck size={18} className="shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  )
}
