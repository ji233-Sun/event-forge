import { notFound } from 'next/navigation'
import { getSurveyDetail } from '../../actions'
import { SurveyEditorClient } from './survey-editor-client'

export default async function EditSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params
  const survey = await getSurveyDetail(surveyId)

  if (!survey) {
    notFound()
  }

  return (
    <SurveyEditorClient
      surveyId={surveyId}
      initialSurvey={{
        title: survey.title,
        description: survey.description ?? '',
        status: survey.status,
        slug: survey.slug,
        questions: survey.questions.map((question) => ({
          id: question.id,
          type: question.type,
          title: question.title,
          description: question.description ?? '',
          required: question.required,
          options: (question.options as string[] | null) ?? [],
          order: question.order,
        })),
      }}
    />
  )
}
