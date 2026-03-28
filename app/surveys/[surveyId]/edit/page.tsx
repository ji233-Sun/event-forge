'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveQuestions } from '../../actions'
import { getSurveyDetail } from '../../actions'
import { QuestionEditor, type QuestionData } from '../components/question-editor'
import { SurveyPreview } from '../components/survey-preview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconArrowLeft, IconLoader2, IconPlus, IconDeviceFloppy, IconEye, IconEdit } from '@tabler/icons-react'

export default function EditSurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const router = useRouter()
  const [surveyId, setSurveyId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    params.then(async ({ surveyId }) => {
      setSurveyId(surveyId)
      try {
        const data = await getSurveyDetail(surveyId)
        if (!data) {
          setError('Survey not found')
          return
        }
        setTitle(data.title)
        setDescription(data.description ?? '')
        setQuestions(
          data.questions.map((q) => ({
            id: q.id,
            type: q.type,
            title: q.title,
            description: q.description ?? '',
            required: q.required,
            options: (q.options as string[]) ?? [],
            order: q.order,
          })),
        )
      } catch {
        setError('Failed to load survey')
      } finally {
        setLoading(false)
      }
    })
  }, [params])

  function addQuestion() {
    const newQ: QuestionData = {
      id: crypto.randomUUID(),
      type: 'short_text',
      title: '',
      description: '',
      required: false,
      options: [],
      order: questions.length,
    }
    setQuestions([...questions, newQ])
  }

  function updateQuestion(index: number, updated: QuestionData) {
    const newQuestions = [...questions]
    newQuestions[index] = updated
    setQuestions(newQuestions)
  }

  function deleteQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await saveQuestions(
        surveyId,
        questions.map((q, i) => ({
          id: q.id,
          type: q.type,
          title: q.title || 'Untitled Question',
          description: q.description || undefined,
          required: q.required,
          options: q.options.length > 0 ? q.options : undefined,
          order: i,
        })),
      )
      router.push('/surveys')
      router.refresh()
    } catch {
      setError('Failed to save questions')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <IconLoader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/surveys">Back to Surveys</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/surveys"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconArrowLeft size={16} />
            Back to Surveys
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <Badge variant="secondary">Draft</Badge>
              </div>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="md:hidden"
              >
                {showPreview ? <IconEdit size={16} /> : <IconEye size={16} />}
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><IconLoader2 size={16} className="animate-spin" />Saving...</>
                ) : (
                  <><IconDeviceFloppy size={16} />Save Questions</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          {/* Editor */}
          <div className={showPreview ? 'hidden md:block' : ''}>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  onChange={(updated) => updateQuestion(i, updated)}
                  onDelete={() => deleteQuestion(i)}
                />
              ))}

              <button
                onClick={addQuestion}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <IconPlus size={18} />
                Add Question
              </button>
            </div>
          </div>

          {/* Preview sidebar (desktop) / full screen (mobile toggle) */}
          <div className={`${showPreview ? '' : 'hidden md:block'}`}>
            <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Preview
              </h3>
              <SurveyPreview title={title} description={description} questions={questions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
