import { notFound } from 'next/navigation'
import { getResponseById } from '@/app/(dashboard)/surveys/actions'
import { ResponseDetail } from './response-detail'

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string; responseId: string }>
}) {
  const { surveyId, responseId } = await params
  const data = await getResponseById(surveyId, responseId)

  if (!data) notFound()

  return (
    <ResponseDetail
      surveyId={surveyId}
      responseIndex={data.responseIndex}
      response={data.response}
      questions={data.questions}
      prevId={data.prevId}
      nextId={data.nextId}
    />
  )
}
