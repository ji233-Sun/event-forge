import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Button } from '@/components/ui/button'
import { IconPlus, IconSparkles } from '@tabler/icons-react'
import { getUserCustomTypes } from './actions'
import { QuestionTypeList } from './question-type-list'

export default async function QuestionTypesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const types = await getUserCustomTypes()

  return (
    <div className="min-h-full bg-background/50">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <IconSparkles size={14} />
              AI Studio
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Question Library
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Your custom-built, interactive question types. Reusable across all your surveys and events.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 px-6 shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98]">
            <Link href="/question-types/new" className="flex items-center gap-2">
              <IconPlus size={18} />
              <span className="font-bold">New Component</span>
            </Link>
          </Button>
        </div>

        <QuestionTypeList initialTypes={types} />
      </div>
    </div>
  )
}
