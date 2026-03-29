'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { formatAnswer } from '@/app/(dashboard)/surveys/lib/format-answer'

const CustomQuestionRenderer = dynamic(
  () =>
    import(
      '@/app/(dashboard)/surveys/[surveyId]/components/custom-question-renderer'
    ).then((m) => m.CustomQuestionRenderer),
  { ssr: false, loading: () => <div className="h-10 animate-pulse rounded-lg bg-muted" /> },
)

const responseDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

type Question = {
  id: string
  type: string
  title: string
  order: number
  displayCodeSnapshot?: string | null
}

type Props = {
  surveyId: string
  responseIndex: number
  response: {
    id: string
    createdAt: Date
    answers: Record<string, unknown>
  }
  questions: Question[]
  prevId: string | null
  nextId: string | null
}

export function ResponseDetail({
  surveyId,
  responseIndex,
  response,
  questions,
  prevId,
  nextId,
}: Props) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-border bg-background flex flex-col gap-6 p-6">
        <Link
          href={`/surveys/${surveyId}?tab=responses`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <IconChevronLeft size={16} />
          All responses
        </Link>

        <Separator />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Response
          </p>
          <p className="text-3xl font-bold">#{responseIndex}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Submitted
          </p>
          <p className="text-sm text-foreground">
            {responseDateFormatter.format(new Date(response.createdAt))}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Separator />
          <div className="flex justify-between pt-1">
            {prevId ? (
              <Link
                href={`/surveys/${surveyId}/responses/${prevId}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <IconChevronLeft size={14} />
                Prev
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground/40">Prev</span>
            )}
            {nextId ? (
              <Link
                href={`/surveys/${surveyId}/responses/${nextId}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Next
                <IconChevronRight size={14} />
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground/40">Next</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-muted/30 p-6 md:p-8">
        <div className="max-w-2xl space-y-4">
          {questions.map((q) => {
            const answer = response.answers[q.id]
            return (
              <Card key={q.id} className="border-border/50">
                <CardContent className="p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {q.order + 1} · {q.title}
                  </p>
                  <AnswerValue
                    type={q.type}
                    answer={answer}
                    displayCodeSnapshot={q.displayCodeSnapshot}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function AnswerValue({
  type,
  answer,
  displayCodeSnapshot,
}: {
  type: string
  answer: unknown
  displayCodeSnapshot?: string | null
}) {
  if (answer === undefined || answer === null || answer === '') {
    return <p className="text-sm italic text-muted-foreground">No answer provided</p>
  }

  if (type.startsWith('custom:') && displayCodeSnapshot) {
    return (
      <CustomQuestionRenderer
        code={displayCodeSnapshot}
        mode="display"
        answer={answer}
      />
    )
  }

  if (Array.isArray(answer)) {
    return (
      <div className="flex flex-wrap gap-2">
        {answer.map((item, i) => (
          <span
            key={i}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-sm"
          >
            {String(item)}
          </span>
        ))}
      </div>
    )
  }

  return <p className="text-sm text-foreground leading-relaxed">{formatAnswer(answer)}</p>
}
