import { getSurveyDetail } from '../actions'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  IconUsers,
  IconClipboardList,
} from '@tabler/icons-react'
import { ResponsesTable } from './components/responses-table'
import { CopyLinkButton } from './components/copy-link-button'
import { SurveyActions } from './components/survey-actions'

const surveyDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

export default async function SurveyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ surveyId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { surveyId } = await params
  const { tab } = await searchParams
  const data = await getSurveyDetail(surveyId)

  if (!data) notFound()

  const publicUrl = data.slug ? `/s/${data.slug}` : `/s/${data.id}`

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
              <Badge variant={data.status === 'published' ? 'default' : data.status === 'closed' ? 'outline' : 'secondary'}>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </Badge>
            </div>
            {data.description && (
              <p className="mt-1 text-muted-foreground">{data.description}</p>
            )}
          </div>
          <SurveyActions surveyId={surveyId} status={data.status} publicUrl={publicUrl} />
        </div>

        <Tabs defaultValue={tab === 'responses' ? 'responses' : 'overview'}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="responses">
              Responses ({data.responses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard icon={<IconClipboardList size={20} />} label="Questions" value={data.questions.length} />
              <StatCard icon={<IconUsers size={20} />} label="Responses" value={data.responses.length} />
              <StatCard
                icon={<IconClipboardList size={20} />}
                label="Status"
                value={data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              />
              <StatCard
                icon={<IconClipboardList size={20} />}
                label="Created"
                value={surveyDateFormatter.format(new Date(data.createdAt))}
              />
            </div>

            {/* Share link */}
            {data.status === 'published' && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Share Link</CardTitle>
                  <CardDescription>
                    Share this link with people to collect responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CopyLinkButton path={publicUrl} />
                </CardContent>
              </Card>
            )}

            {/* Questions list */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.questions.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium">{q.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {q.type.replaceAll('_', ' ')}
                    </Badge>
                    {q.required && (
                      <span className="text-xs text-destructive">required</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="mt-6">
            <ResponsesTable
              surveyId={surveyId}
              questions={data.questions}
              responses={data.responses}
            />
          </TabsContent>
        </Tabs>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
