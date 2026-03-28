'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveQuestions, publishSurvey } from '../../actions'
import { QuestionEditor, type QuestionData } from '../components/question-editor'
import { SurveyPreview } from '../components/survey-preview'
import { CopyLinkButton } from '../components/copy-link-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader2,
  IconPlus,
  IconDeviceFloppy,
  IconEye,
  IconEdit,
  IconCircleCheck,
  IconShare,
} from '@tabler/icons-react'

type SurveyEditorState = {
  title: string
  description: string
  status: string
  slug: string | null
  questions: QuestionData[]
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function SurveyEditorClient({
  surveyId,
  initialSurvey,
}: {
  surveyId: string
  initialSurvey: SurveyEditorState
}) {
  const router = useRouter()
  const title = initialSurvey.title
  const description = initialSurvey.description
  const [questions, setQuestions] = useState<QuestionData[]>(initialSurvey.questions)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [surveyStatus, setSurveyStatus] = useState(initialSurvey.status)
  const [surveySlug, setSurveySlug] = useState<string | null>(initialSurvey.slug)

  function addQuestion() {
    const newQuestion: QuestionData = {
      id: crypto.randomUUID(),
      type: 'short_text',
      title: '',
      description: '',
      required: false,
      options: [],
      order: questions.length,
    }

    setQuestions((current) => [...current, newQuestion])
  }

  function updateQuestion(index: number, updatedQuestion: QuestionData) {
    setQuestions((current) => {
      const nextQuestions = [...current]
      nextQuestions[index] = updatedQuestion
      return nextQuestions
    })
  }

  function deleteQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, questionIndex) => ({ ...question, order: questionIndex })),
    )
  }

  function buildQuestionsPayload() {
    return questions.map((question, index) => ({
      id: question.id,
      type: question.type,
      title: question.title || 'Untitled Question',
      description: question.description || undefined,
      required: question.required,
      options: question.options.length > 0 ? question.options : undefined,
      order: index,
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    try {
      await saveQuestions(surveyId, buildQuestionsPayload())
      router.push(`/surveys/${surveyId}`)
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to save questions'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndPublish() {
    setPublishing(true)
    setError('')

    try {
      await saveQuestions(surveyId, buildQuestionsPayload())
      const result = await publishSurvey(surveyId)
      if (result?.slug) {
        setSurveySlug(result.slug)
      }
      setSurveyStatus('published')
      router.refresh()
    } catch (publishError) {
      setError(getErrorMessage(publishError, 'Failed to save and publish'))
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <Badge variant={surveyStatus === 'published' ? 'default' : 'secondary'}>
                {surveyStatus === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowPreview((current) => !current)}
              className="md:hidden"
            >
              {showPreview ? <IconEdit size={16} /> : <IconEye size={16} />}
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            {surveyStatus === 'published' && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/surveys/${surveyId}`}>
                  <IconShare size={16} />
                  View Details
                </Link>
              </Button>
            )}
            <Button size="sm" type="button" onClick={handleSave} disabled={saving || publishing}>
              {saving ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy size={16} />
                  Save
                </>
              )}
            </Button>
            {surveyStatus === 'draft' && questions.length > 0 && (
              <Button
                size="sm"
                type="button"
                onClick={handleSaveAndPublish}
                disabled={saving || publishing}
              >
                {publishing ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <IconCircleCheck size={16} />
                    Save & Publish
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {surveyStatus === 'published' && surveySlug && (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <IconShare size={16} className="text-primary" />
            <span className="text-sm font-medium">Share Link</span>
          </div>
          <CopyLinkButton path={`/s/${surveySlug}`} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className={showPreview ? 'hidden md:block' : ''}>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                onDelete={() => deleteQuestion(index)}
              />
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <IconPlus size={18} />
              Add Question
            </button>
          </div>
        </div>

        <div className={showPreview ? '' : 'hidden md:block'}>
          <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Preview
            </h3>
            <SurveyPreview title={title} description={description} questions={questions} />
          </div>
        </div>
      </div>
    </div>
  )
}
