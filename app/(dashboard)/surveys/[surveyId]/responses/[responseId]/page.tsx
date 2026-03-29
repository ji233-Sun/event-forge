import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getResponseById } from '@/app/(dashboard)/surveys/actions'
import { ResponseDetail } from './response-detail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surveyId: string; responseId: string }>
}): Promise<Metadata> {
  const { surveyId, responseId } = await params
  const data = await getResponseById(surveyId, responseId)
  if (!data) return {}
  return { title: `Response #${data.responseIndex} — ${data.survey.title}` }
}

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
