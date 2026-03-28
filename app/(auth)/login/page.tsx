'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
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
  IconEye,
  IconEyeOff,
  IconLoader2,
} from '@tabler/icons-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? '登录失败，请检查邮箱和密码')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-[400px] border-border/50 shadow-xl shadow-primary/5 transition-all">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">欢迎回来</CardTitle>
        <CardDescription>
          请登录你的账户以访问 EventForge
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 animate-in fade-in zoom-in-95 duration-200"
            >
              <IconAlertCircle size={18} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

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
          <Button type="submit" className="h-11 w-full text-base font-medium shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" disabled={loading}>
            {loading ? (
              <>
                <IconLoader2 size={18} className="animate-spin mr-2" />
                正在登录...
              </>
            ) : (
              '登录'
            )}
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              还没有账户？{' '}
              <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                立即免费注册
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
