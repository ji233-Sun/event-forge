import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react'
import { getMinitoolById, getMinitoolParticipants } from '../actions'
import { CopyLinkButton } from './copy-link-button'
import { MinitoolPublicToggle } from './minitool-public-toggle'

const MinitoolRenderer = dynamic(
  () => import('@/components/minitool-renderer').then((m) => m.MinitoolRenderer),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" /> },
)

export default async function MinitoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const tool = await getMinitoolById(id)
  if (!tool) notFound()

  const participants = await getMinitoolParticipants(id)
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/t/${tool.id}`

  return (
    <div className="min-h-full bg-background/50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/minitools"><IconArrowLeft size={20} /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{tool.name}</h1>
            <p className="text-sm text-muted-foreground">{participants.length} participants</p>
          </div>
          <Badge
            variant="outline"
            className={tool.isPublic ? 'bg-green-500/5 text-green-600 border-green-200' : ''}
          >
            {tool.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>

        {/* Control bar */}
        <Card className="border-border/40">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <code className="flex-1 min-w-0 truncate rounded bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground">
              {shareUrl}
            </code>
            <div className="flex items-center gap-2">
              <CopyLinkButton url={shareUrl} />
              <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                <Link href={`/t/${tool.id}`} target="_blank">
                  <IconExternalLink size={14} />Open
                </Link>
              </Button>
              <MinitoolPublicToggle minitoolId={tool.id} initialIsPublic={tool.isPublic} />
            </div>
          </CardContent>
        </Card>

        {/* Host View */}
        <Card className="border-border/40 overflow-hidden">
          <CardHeader className="bg-muted/20 pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Host View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <MinitoolRenderer
              code={tool.hostCode}
              minitoolId={tool.id}
              mode="host"
              participantCount={participants.length}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Participants table */}
        <div>
          <h2 className="mb-4 text-base font-semibold">Participants ({participants.length})</h2>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No participants yet. Share the link to get started.</p>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Visitor</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Data</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.visitorId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 max-w-xs">
                        <pre className="truncate text-xs text-muted-foreground">{JSON.stringify(p.data)}</pre>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(p.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
