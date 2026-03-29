'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { publishSurvey } from '@/app/(dashboard)/surveys/actions'
import { Button } from '@/components/ui/button'
import {
  IconExternalLink,
  IconEdit,
  IconCircleCheck,
  IconLoader2,
} from '@tabler/icons-react'

export function SurveyActions({
  surveyId,
  status,
  publicUrl,
}: {
  surveyId: string
  status: string
  publicUrl: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRepublish() {
    setLoading(true)
    setError('')
    try {
      await publishSurvey(surveyId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to republish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {status === 'published' && (
          <Button variant="outline" size="sm" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <IconExternalLink size={16} />
              Open Survey
            </a>
          </Button>
        )}
        {status === 'closed' && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/surveys/${surveyId}/edit`}>
                <IconEdit size={16} />
                Edit
              </Link>
            </Button>
            <Button size="sm" onClick={handleRepublish} disabled={loading}>
              {loading
                ? <IconLoader2 size={16} className="animate-spin" />
                : <IconCircleCheck size={16} />}
              Republish
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
