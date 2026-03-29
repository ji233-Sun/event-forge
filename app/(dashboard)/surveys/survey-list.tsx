'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteSurvey, publishSurvey, closeSurvey } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareLinkDialogButton } from '@/components/share-link-dialog-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  IconEdit,
  IconTrash,
  IconChartBar,
  IconLoader2,
  IconEye,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react'
import { useState } from 'react'

const surveyDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

type SurveyWithCounts = {
  id: string
  title: string
  description: string | null
  status: string
  slug: string | null
  createdAt: Date
  questions: { id: string }[]
  responses: { id: string }[]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    published: { label: 'Published', variant: 'default' },
    closed: { label: 'Closed', variant: 'outline' },
  }
  const config = map[status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function SurveyList({ surveys }: { surveys: SurveyWithCounts[] }) {
  if (surveys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <p className="text-muted-foreground mb-4">No surveys yet</p>
        <Button asChild>
          <Link href="/surveys/new">
            <IconEdit size={18} />
            Create Your First Survey
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {surveys.map((s) => (
        <SurveyCard key={s.id} survey={s} />
      ))}
    </div>
  )
}

function SurveyCard({ survey: s }: { survey: SurveyWithCounts }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePublish() {
    setLoading(true)
    setError('')
    try {
      await publishSurvey(s.id)
      router.refresh()
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish survey')
      console.error('Failed to publish survey', publishError)
    } finally {
      setLoading(false)
    }
  }

  async function handleClose() {
    setLoading(true)
    setError('')
    try {
      await closeSurvey(s.id)
      router.refresh()
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Failed to close survey')
      console.error('Failed to close survey', closeError)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await deleteSurvey(s.id)
      router.refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete survey')
      console.error('Failed to delete survey', deleteError)
    } finally {
      setLoading(false)
    }
  }

  const status = s.status

  return (
    <Card className="border-border/50 transition-all hover:shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg truncate">{s.title}</CardTitle>
            <StatusBadge status={status} />
          </div>
          {s.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{s.questions.length} questions</span>
            <span>{s.responses.length} responses</span>
            <span>{surveyDateFormatter.format(new Date(s.createdAt))}</span>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {status === 'draft' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/surveys/${s.id}/edit`}>
                  <IconEdit size={16} />
                  Edit
                </Link>
              </Button>
              <Button size="sm" onClick={handlePublish} disabled={loading || s.questions.length === 0}>
                {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCircleCheck size={16} />}
                Publish
              </Button>
            </>
          )}
          {status === 'published' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/surveys/${s.id}`}>
                  <IconChartBar size={16} />
                  Results
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/s/${s.id}`} target="_blank">
                  <IconEye size={16} />
                  Preview
                </Link>
              </Button>
              {s.slug && (
                <ShareLinkDialogButton
                  url={`/s/${s.slug}`}
                  triggerSize="icon-sm"
                  iconSize={16}
                  triggerTitle="Open public link"
                  triggerAriaLabel="Open public link"
                  dialogTitle="Share Survey"
                  dialogDescription="Scan the QR code or copy this public survey link to share."
                />
              )}
              <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCircleX size={16} />}
                Close
              </Button>
            </>
          )}
          {status === 'closed' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/surveys/${s.id}/edit`}>
                  <IconEdit size={16} />
                  Edit
                </Link>
              </Button>
              <Button size="sm" onClick={handlePublish} disabled={loading}>
                {loading ? <IconLoader2 size={16} className="animate-spin" /> : <IconCircleCheck size={16} />}
                Republish
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/surveys/${s.id}`}>
                  <IconChartBar size={16} />
                  Results
                </Link>
              </Button>
            </>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                aria-label="Delete survey"
                title="Delete survey"
              >
                <IconTrash size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Survey</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{s.title}&quot;? This action cannot be undone. All questions and responses will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  {loading ? <IconLoader2 size={16} className="animate-spin" /> : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
    </Card>
  )
}
