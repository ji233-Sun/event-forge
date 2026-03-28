'use client'

import dynamic from 'next/dynamic'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

const CustomQuestionRenderer = dynamic(
  () => import('./custom-question-renderer').then(m => m.CustomQuestionRenderer),
  { ssr: false, loading: () => <div className="h-6 w-24 animate-pulse rounded bg-muted" /> }
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
  options: unknown
  formCodeSnapshot?: string | null
  displayCodeSnapshot?: string | null
}

type ResponseData = {
  id: string
  answers: Record<string, string | string[] | Record<string, unknown>>
  createdAt: Date
}

export function ResponsesTable({
  questions,
  responses,
}: {
  questions: Question[]
  responses: ResponseData[]
}) {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
        <p className="text-muted-foreground">No responses yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your survey link to start collecting responses
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  {questions.map((q) => (
                    <th key={q.id} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {q.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {responseDateFormatter.format(new Date(r.createdAt))}
                    </td>
                    {questions.map((q) => (
                      <td key={q.id} className="px-4 py-3 max-w-[200px] truncate">
                        {isCustomType(q.type) && q.displayCodeSnapshot
                          ? <CustomQuestionRenderer
                              code={q.displayCodeSnapshot}
                              mode="display"
                              answer={r.answers[q.id]}
                            />
                          : formatAnswer(r.answers[q.id])
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function isCustomType(type: string) {
  return type.startsWith('custom:')
}

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
