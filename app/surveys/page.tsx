import Link from 'next/link'
import { getUserSurveys } from './actions'
import { SurveyList } from './survey-list'
import { Button } from '@/components/ui/button'
import { IconPlus, IconArrowLeft } from '@tabler/icons-react'

export default async function SurveysPage() {
  const surveys = await getUserSurveys()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Surveys</h1>
              <p className="mt-1 text-muted-foreground">
                Create and manage your surveys
              </p>
            </div>
            <Button asChild>
              <Link href="/surveys/new">
                <IconPlus size={18} />
                Create Survey
              </Link>
            </Button>
          </div>
        </div>

        <SurveyList surveys={surveys} />
      </div>
    </div>
  )
}
