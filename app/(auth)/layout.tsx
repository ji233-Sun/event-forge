import Link from 'next/link'
import { IconBolt } from '@tabler/icons-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 antialiased">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* 品牌标识 */}
        <Link href="/" className="mb-8 flex items-center gap-2 group transition-all hover:scale-105 active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 ring-1 ring-primary/20 transition-all group-hover:shadow-primary/40 group-hover:rotate-6">
            <IconBolt size={22} className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            EventForge
          </span>
        </Link>

        {children}
      </div>
    </div>
  )
}
