import { notFound } from 'next/navigation'
import { getSurveyDetail } from '../../actions'
import { getUserCustomTypes } from '@/app/(dashboard)/question-types/actions'
import { SurveyEditorClient } from './survey-editor-client'

export default async function EditSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params
  const [survey, customTypes] = await Promise.all([
    getSurveyDetail(surveyId),
    getUserCustomTypes(),
  ])

  if (!survey) {
    notFound()
  }

  return (
    <SurveyEditorClient
      surveyId={surveyId}
      customTypes={customTypes.map((t) => ({ id: t.id, name: t.name, formCode: t.formCode }))}
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
