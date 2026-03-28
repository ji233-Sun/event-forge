import { db } from '@/lib/db'
import { survey, response, question } from '@/lib/db/auth-schema'
import { eq, and, or } from 'drizzle-orm'

type AnswerValue = string | string[]

type SurveyQuestionRecord = {
  id: string
  type: string
  required: boolean
  options: string[] | null
}

const ratingValues = new Set(['1', '2', '3', '4', '5'])

function normalizeOptions(options: string[] | null) {
  if (!Array.isArray(options)) {
    return []
  }

  return options.map((option) => option.trim()).filter((option) => option.length > 0)
}

function isMissingAnswer(value: AnswerValue | undefined) {
  return value === undefined || (Array.isArray(value) ? value.length === 0 : value.length === 0)
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
    columns: { id: true, type: true, required: true, options: true },
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
