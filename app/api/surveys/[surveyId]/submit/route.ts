import { db } from '@/lib/db'
import { survey, response, question } from '@/lib/db/auth-schema'
import { eq, and, or } from 'drizzle-orm'

type AnswerValue = string | string[] | Record<string, unknown>

type SurveyQuestionRecord = {
  id: string
  title: string
  type: string
  required: boolean
  options: string[] | null
  formCodeSnapshot?: string | null
  displayCodeSnapshot?: string | null
}

const ratingValues = new Set(['1', '2', '3', '4', '5'])

function normalizeOptions(options: string[] | null) {
  if (!Array.isArray(options)) {
    return []
  }

  return options.map((option) => option.trim()).filter((option) => option.length > 0)
}

function isMissingAnswer(value: AnswerValue | undefined) {
  if (value === undefined || value === null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

function validateAndNormalizeAnswers(
  rawAnswers: unknown,
  questions: SurveyQuestionRecord[],
): { answers: Record<string, AnswerValue> } | { error: string } {
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    return { error: 'Invalid answers payload' }
  }

  const questionMap = new Map(questions.map((item) => [item.id, item]))
  const normalizedAnswers: Record<string, AnswerValue> = {}

  for (const [questionId, rawValue] of Object.entries(rawAnswers as Record<string, unknown>)) {
    const surveyQuestion = questionMap.get(questionId)
    if (!surveyQuestion) {
      return { error: 'Invalid answer set' }
    }

    if (surveyQuestion.type.startsWith('custom:')) {
      const ans = rawValue as AnswerValue | undefined
      // Use isMissingAnswer to check if custom field is empty.
      // The early check here provides a better UX error message with the specific field name,
      // which is superior to the generic "Missing required answers" from the final validation pass.
      if (surveyQuestion.required && isMissingAnswer(ans)) {
        return { error: `Question "${surveyQuestion.title}" is required.` }
      }
      if (!isMissingAnswer(ans)) {
        normalizedAnswers[questionId] = ans as AnswerValue
      }
      continue
    }

    if (surveyQuestion.type === 'multiple_choice') {
      if (!Array.isArray(rawValue) || rawValue.some((value) => typeof value !== 'string')) {
        return { error: 'Invalid answer set' }
      }

      const allowedOptions = normalizeOptions(surveyQuestion.options)
      const values = rawValue
        .map((value) => value.trim())
        .filter((value) => value.length > 0)

      if (allowedOptions.length > 0 && values.some((value) => !allowedOptions.includes(value))) {
        return { error: 'Invalid answer set' }
      }

      if (values.length > 0) {
        normalizedAnswers[questionId] = Array.from(new Set(values))
      }

      continue
    }

    if (typeof rawValue !== 'string') {
      return { error: 'Invalid answer set' }
    }

    const value = rawValue.trim()

    if (surveyQuestion.type === 'rating' && value.length > 0 && !ratingValues.has(value)) {
      return { error: 'Invalid answer set' }
    }

    if (
      (surveyQuestion.type === 'single_choice' || surveyQuestion.type === 'dropdown') &&
      value.length > 0
    ) {
      const allowedOptions = normalizeOptions(surveyQuestion.options)
      if (allowedOptions.length > 0 && !allowedOptions.includes(value)) {
        return { error: 'Invalid answer set' }
      }
    }

    if (value.length > 0) {
      normalizedAnswers[questionId] = value
    }
  }

  for (const surveyQuestion of questions) {
    if (surveyQuestion.required && isMissingAnswer(normalizedAnswers[surveyQuestion.id])) {
      return { error: 'Missing required answers' }
    }
  }

  return { answers: normalizedAnswers }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { surveyId } = await params

  let rawAnswers: unknown
  try {
    const body = await request.json()
    rawAnswers = (body as { answers?: unknown }).answers
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Verify survey exists and is published (support both ID and slug)
  const s = await db.query.survey.findFirst({
    where: and(
      or(eq(survey.id, surveyId), eq(survey.slug, surveyId)),
      eq(survey.status, 'published'),
    ),
  })

  if (!s) {
    return Response.json({ error: 'Survey not found or not published' }, { status: 404 })
  }

  // Load questions to validate answer keys, types, and required fields
  const qs = await db.query.question.findMany({
    where: eq(question.surveyId, s.id),
    columns: { id: true, title: true, type: true, required: true, options: true, formCodeSnapshot: true, displayCodeSnapshot: true },
  })

  const validation = validateAndNormalizeAnswers(rawAnswers, qs)
  if ('error' in validation) {
    return Response.json({ error: validation.error }, { status: 400 })
  }

  // Insert response using the actual survey ID
  await db.insert(response).values({
    id: crypto.randomUUID(),
    surveyId: s.id,
    answers: validation.answers,
  })

  return Response.json({ success: true })
}
