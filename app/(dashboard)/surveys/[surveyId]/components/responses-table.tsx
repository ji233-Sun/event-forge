import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { getPreview } from '@/app/(dashboard)/surveys/lib/format-answer'

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
  answers: Record<string, unknown>
  createdAt: Date
}

export function ResponsesTable({
  surveyId,
  questions,
  responses,
}: {
  surveyId: string
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
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preview</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r, i) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {responseDateFormatter.format(new Date(r.createdAt))}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {getPreview(r.answers, questions)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/surveys/${surveyId}/responses/${r.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
