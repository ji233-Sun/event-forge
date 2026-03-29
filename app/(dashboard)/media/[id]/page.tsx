import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconArrowLeft, IconSparkles } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { getMediaRecord } from '../actions'
import { MediaDetailContent } from './media-detail-content'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const record = await getMediaRecord(id)
  return {
    title: record ? `${record.result.concept.title} — Media Studio` : 'Media Studio',
  }
}

export default async function MediaDetailPage({ params }: PageProps) {
  const { id } = await params
  const record = await getMediaRecord(id)

  if (!record) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 md:px-8">
      <div className="mb-7 flex items-start justify-between gap-4 sm:mb-8">
        <div>
          <Button asChild size="sm" variant="ghost" className="-ml-2 mb-3 text-muted-foreground">
            <Link href="/media">
              <IconArrowLeft size={14} />
              Back to Media Studio
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <IconSparkles size={24} className="text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {record.result.concept.title}
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{record.brief}</p>
        </div>
      </div>

      <MediaDetailContent record={record} />
    </div>
  )
}
