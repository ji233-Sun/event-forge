'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { getOtpErrorMessage, useOtpCooldown } from '@/hooks/use-otp-cooldown'
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
   * Step 1: Create account + send verification code
   * BetterAuth emailOTP email-verification type requires the user to exist first,
   * so we must signUp before sendVerificationOtp.
   */
  async function handleRegisterAndSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    // 1. Create account (emailVerified starts as false)
    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: email,
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message ?? 'Registration failed, this email may already be registered')
      return
    }

    // 2. User exists, send verification code
    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message ?? 'Failed to send verification code, please try again later')
      return
    }

    startCooldown()
    setInfo('Verification code sent, please check your email')
    setStep('verify')
  }

  /** Step 2: Verify OTP, mark emailVerified: true */
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
      setError(getOtpErrorMessage(verifyError.code))
      return
    }

    router.push('/')
    router.refresh()
  }

  /** Resend verification code */
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
      setError(otpError.message ?? 'Failed to send, please try again later')
      return
    }

    startCooldown()
    setInfo('Verification code resent')
  }

  return (
    <Card className="w-full max-w-[400px] border-border/50 shadow-xl shadow-primary/5 transition-all">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
        <CardDescription>
          {step === 'form'
            ? 'Get started with EventForge in seconds'
            : `Verification code sent to ${email}`}
        </CardDescription>
      </CardHeader>

      {step === 'form' ? (
        <form onSubmit={handleRegisterAndSendOtp}>
          <CardContent className="space-y-4">
            {error && <ErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
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
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative group">
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Enter again to confirm"
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
                <><IconLoader2 size={18} className="animate-spin mr-2" />Processing...</>
              ) : (
                'Sign Up & Get Code'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign In
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
              <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
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
                <><IconLoader2 size={18} className="animate-spin mr-2" />Verifying...</>
              ) : (
                'Verify & Complete Registration'
              )}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              disabled={!canResend || loading}
              onClick={handleResend}
            >
              {canResend ? "Didn't receive the email? Resend" : `Resend (${cooldown}s)`}
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
      aria-label={show ? 'Hide password' : 'Show password'}
      onClick={onToggle}
      className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground group-focus-within:text-foreground"
    >
      {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
    </button>
  )
}
