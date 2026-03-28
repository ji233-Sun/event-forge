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

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const { cooldown, canResend, startCooldown } = useOtpCooldown()

  /**
   * 第一步：创建账号 + 发送验证码
   * BetterAuth emailOTP 的 email-verification 类型要求用户已存在，
   * 所以必须先 signUp，再 sendVerificationOtp。
   */
  async function handleRegisterAndSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    if (password.length < 8) {
      setError('密码长度至少 8 位')
      return
    }

    setLoading(true)

    // 1. 创建账号（emailVerified 初始为 false）
    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: email,
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message ?? '注册失败，该邮箱可能已被注册')
      return
    }

    // 2. 用户已存在，发送验证码
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
  }

  /** 第二步：验证 OTP，标记 emailVerified: true */
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    })

    setLoading(false)

    if (verifyError) {
      setError(verifyError.message ?? '验证码错误或已过期，请重新发送')
      return
    }

    router.push('/')
    router.refresh()
  }

  /** 重新发送验证码 */
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

  return (
    <Card className="w-full max-w-[400px] border-border/50 shadow-xl shadow-primary/5 transition-all">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">创建账户</CardTitle>
        <CardDescription>
          {step === 'form'
            ? '只需几秒钟，开启你的 EventForge 旅程'
            : `验证码已发送至 ${email}`}
        </CardDescription>
      </CardHeader>

      {step === 'form' ? (
        <form onSubmit={handleRegisterAndSendOtp}>
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
              <Label htmlFor="password">设置密码</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="至少 8 位字符"
                  autoComplete="new-password"
                  required
                  className="h-11 pr-11 transition-all focus-visible:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">确认密码</Label>
              <div className="relative group">
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="再次输入以确认"
                  autoComplete="new-password"
                  required
                  className="h-11 pr-11 transition-all focus-visible:ring-primary/20"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <PasswordToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-2">
            <Button
              type="submit"
              className="h-11 w-full text-base font-medium shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? (
                <><IconLoader2 size={18} className="animate-spin mr-2" />处理中...</>
              ) : (
                '注册并获取验证码'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              已有账户？{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                立即登录
              </Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
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
              {loading ? (
                <><IconLoader2 size={18} className="animate-spin mr-2" />验证中...</>
              ) : (
                '验证并完成注册'
              )}
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
      )}
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

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={show ? '隐藏密码' : '显示密码'}
      onClick={onToggle}
      className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground group-focus-within:text-foreground"
    >
      {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
    </button>
  )
}
