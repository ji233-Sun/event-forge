import Link from 'next/link'
import { getUserSurveys } from './actions'
import { SurveyList } from './survey-list'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'

export default async function SurveysPage() {
  const surveys = await getUserSurveys()

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
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

      <SurveyList surveys={surveys} />
    </div>
  )
}
