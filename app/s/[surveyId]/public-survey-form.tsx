'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { IconLoader2, IconCircleCheck, IconStarFilled } from '@tabler/icons-react'

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

function isMissingAnswer(value: string | string[] | undefined) {
  if (value === undefined) {
    return true
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return value.trim().length === 0
}

export function PublicSurveyForm({ survey }: { survey: SurveyData }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    for (const question of survey.questions) {
      if (question.required && isMissingAnswer(answers[question.id])) {
        setError(`Please answer: ${question.title}`)
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/surveys/${survey.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to submit. Please try again.')
      }

      setSubmitted(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <IconCircleCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Thank You!</h1>
          <p className="mt-2 text-muted-foreground">
            Your response has been submitted successfully.
          </p>
        </div>
      </div>
    )
  }

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
              {survey.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {question.order + 1}. {question.title}
                    {question.required && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                  {question.description && (
                    <p className="text-xs text-muted-foreground">{question.description}</p>
                  )}
                  <QuestionInput
                    question={question}
                    value={answers[question.id]}
                    onChange={(value) =>
                      setAnswers((current) => ({ ...current, [question.id]: value }))
                    }
                  />
                </div>
              ))}

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full shadow-lg shadow-primary/20"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <IconLoader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
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
  onChange: (value: string | string[]) => void
}) {
  switch (question.type) {
    case 'short_text':
      return (
        <Input
          placeholder="Your answer"
          className="h-10 focus-visible:ring-primary/20"
          value={(value as string) ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )

    case 'long_text':
      return (
        <Textarea
          placeholder="Your answer"
          className="min-h-[100px] focus-visible:ring-primary/20"
          value={(value as string) ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )

    case 'single_choice':
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((option, index) => (
            <label
              key={index}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={(value as string) === option}
                onChange={() => onChange(option)}
                className="accent-primary"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )

    case 'multiple_choice': {
      const selected = (value as string[]) ?? []

      const toggleValue = (option: string) => {
        if (selected.includes(option)) {
          onChange(selected.filter((item) => item !== option))
          return
        }

        onChange([...selected, option])
      }

      return (
        <div className="space-y-2">
          {(question.options ?? []).map((option, index) => (
            <label
              key={index}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                value={option}
                checked={selected.includes(option)}
                onChange={() => toggleValue(option)}
                className="accent-primary"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )
    }

    case 'rating': {
      const currentRating = value ? Number(value) : 0

      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(String(rating))}
              aria-label={`Rate ${rating} out of 5`}
              aria-pressed={rating === currentRating}
              className="transition-transform hover:scale-110"
            >
              <IconStarFilled
                size={28}
                className={rating <= currentRating ? 'text-primary' : 'text-muted-foreground/30'}
              />
            </button>
          ))}
        </div>
      )
    }

    case 'dropdown':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select an option</option>
          {(question.options ?? []).map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      )

    default:
      return null
  }
}
