import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { IconBolt } from '@tabler/icons-react'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-2xl border-border/50 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <IconBolt size={24} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              欢迎回来，{session.user.name || session.user.email}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              邮箱验证和登录闭环已经可用。当前项目还没有业务首页，这里先提供一个受保护的占位页，避免认证成功后落到
              404。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="font-medium text-foreground">当前会话</p>
            <p className="mt-2">邮箱：{session.user.email}</p>
            <p>邮箱已验证：{session.user.emailVerified ? '是' : '否'}</p>
          </div>
          <p>下一步可以在这里接入真正的 dashboard、活动列表或受保护的工作台入口。</p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login">回到登录页</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">创建另一个账户</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
