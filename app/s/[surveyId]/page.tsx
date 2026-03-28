import { notFound } from 'next/navigation'
import { getSurveyForFill } from '@/app/(dashboard)/surveys/actions'
import { PublicSurveyForm } from './public-survey-form'

export default async function PublicSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params
  const survey = await getSurveyForFill(surveyId)

  if (!survey) {
    notFound()
  }

  return (
    <PublicSurveyForm
      survey={{
        id: survey.id,
        title: survey.title,
        description: survey.description ?? null,
        questions: survey.questions.map((question) => ({
          id: question.id,
          type: question.type,
          title: question.title,
          description: question.description ?? null,
          required: question.required,
          options: (question.options as string[] | null) ?? null,
          order: question.order,
        })),
      }}
    />
  )
}
