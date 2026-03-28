'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  IconLoader2,
  IconCircleCheck,
  IconStarFilled,
  IconChevronDown,
} from '@tabler/icons-react'
import { getSurveyForFill } from '@/app/surveys/actions'

type Question = {
  id: string
  type: string
  title: string
  description: string | null
  required: boolean
  options: string[] | null
  order: number
}

type SurveyData = {
  id: string
  title: string
  description: string | null
  questions: Question[]
}

export default function PublicSurveyPage() {
  const params = useParams<{ surveyId: string }>()
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getSurveyForFill(params.surveyId)
      .then((data) => {
        if (!data) {
          setError('Survey not found or not available')
          return
        }
        setSurvey(data as SurveyData)
      })
      .catch(() => setError('Failed to load survey'))
      .finally(() => setLoading(false))
  }, [params.surveyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!survey) return

    // Validate required fields
    for (const q of survey.questions) {
      const answer = answers[q.id]
      const isEmpty = !answer || (Array.isArray(answer) && answer.length === 0)
      if (q.required && isEmpty) {
        setError(`Please answer: ${q.title}`)
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/surveys/${survey.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <IconLoader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <IconCircleCheck size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Thank You!</h1>
          <p className="mt-2 text-muted-foreground">Your response has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  if (!survey) return null

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">{survey.title}</CardTitle>
            {survey.description && (
              <CardDescription className="text-base">{survey.description}</CardDescription>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {survey.questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {q.order + 1}. {q.title}
                    {q.required && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                  {q.description && (
                    <p className="text-xs text-muted-foreground">{q.description}</p>
                  )}
                  <QuestionInput
                    question={q}
                    value={answers[q.id]}
                    onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                  />
                </div>
              ))}

              {error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 shadow-lg shadow-primary/20"
                disabled={submitting}
              >
                {submitting ? (
                  <><IconLoader2 size={18} className="animate-spin" />Submitting...</>
                ) : (
                  'Submit Response'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string | string[] | undefined
  onChange: (val: string | string[]) => void
}) {
  switch (question.type) {
    case 'short_text':
      return (
        <Input
          placeholder="Your answer"
          className="h-10 focus-visible:ring-primary/20"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'long_text':
      return (
        <Textarea
          placeholder="Your answer"
          className="min-h-[100px] focus-visible:ring-primary/20"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'single_choice':
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={(value as string) === opt}
                onChange={() => onChange(opt)}
                className="accent-primary"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )

    case 'multiple_choice': {
      const selected = (value as string[]) ?? []
      const toggle = (opt: string) => {
        if (selected.includes(opt)) {
          onChange(selected.filter((s) => s !== opt))
        } else {
          onChange([...selected, opt])
        }
      }
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                value={opt}
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-primary"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )
    }

    case 'rating': {
      const current = (value as string) ? Number(value as string) : 0
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className="transition-transform hover:scale-110"
            >
              <IconStarFilled
                size={28}
                className={n <= current ? 'text-yellow-500' : 'text-muted-foreground/30'}
              />
            </button>
          ))}
        </div>
      )
    }

    case 'dropdown':
      return (
        <div className="relative">
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select an option</option>
            {(question.options ?? []).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )

    default:
      return null
  }
}
