'use client'

import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { IconStarFilled, IconChevronDown } from '@tabler/icons-react'
import type { QuestionData } from './question-editor'

const CustomQuestionRenderer = dynamic(
  () =>
    import('./custom-question-renderer').then((m) => m.CustomQuestionRenderer),
  { ssr: false, loading: () => <div className="h-16 animate-pulse rounded-lg bg-muted" /> },
)

type CustomType = { id: string; name: string; formCode: string }

export function SurveyPreview({
  title,
  description,
  questions,
  customTypes = [],
}: {
  title: string
  description: string
  questions: QuestionData[]
  customTypes?: CustomType[]
}) {
  const customTypeMap = new Map(customTypes.map((t) => [t.id, t]))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title || 'Untitled Survey'}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <Separator />

      {questions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add questions to see a preview
        </p>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm font-medium">
                {q.order + 1}. {q.title || 'Untitled Question'}
                {q.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {q.description && (
                <p className="text-xs text-muted-foreground">{q.description}</p>
              )}
              <QuestionPreview question={q} customTypeMap={customTypeMap} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuestionPreview({
  question,
  customTypeMap,
}: {
  question: QuestionData
  customTypeMap: Map<string, CustomType>
}) {
  switch (question.type) {
    case 'short_text':
      return <Input placeholder="Short answer text" disabled className="h-9" />

    case 'long_text':
      return <Textarea placeholder="Long answer text" disabled className="min-h-[80px]" />

    case 'single_choice':
      return (
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <div className="h-4 w-4 rounded-full border border-border" />
              {opt || `Option ${i + 1}`}
            </label>
          ))}
        </div>
      )

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <div className="h-4 w-4 rounded-sm border border-border" />
              {opt || `Option ${i + 1}`}
            </label>
          ))}
        </div>
      )

    case 'rating':
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <IconStarFilled key={n} size={24} className="text-muted-foreground/30" />
          ))}
        </div>
      )

    case 'dropdown':
      return (
        <div className="flex h-9 items-center justify-between rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
          Select an option
          <IconChevronDown size={16} />
        </div>
      )

    default: {
      if (question.type.startsWith('custom:')) {
        const typeId = question.type.replace('custom:', '')
        const customType = customTypeMap.get(typeId)
        if (customType) {
          return (
            <CustomQuestionRenderer
              code={customType.formCode}
              mode="form"
              question={{ title: question.title, description: question.description || null }}
            />
          )
        }
      }
      return null
    }
  }
}
