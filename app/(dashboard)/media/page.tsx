import { IconSparkles } from '@tabler/icons-react'
import { getMediaHistory } from './actions'
import { MediaContent } from './media-content'

export const metadata = {
  title: 'Media Studio',
}

export default async function MediaPage() {
  const initialHistory = await getMediaHistory(1)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <IconSparkles size={24} className="text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Media Studio</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate posters, soundtracks, and social copy from an event brief
        </p>
      </div>

      <MediaContent initialHistory={initialHistory} />
    </div>
  )
}
