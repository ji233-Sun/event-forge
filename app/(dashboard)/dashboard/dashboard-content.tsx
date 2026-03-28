'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  IconFileText,
  IconUsers,
  IconChartBar,
  IconTargetArrow,
  IconEdit,
  IconShare,
  IconEye,
  IconDownload,
  IconTrendingUp,
  IconPlus,
  IconLayoutList,
  IconActivity,
} from '@tabler/icons-react'
import { StatusBadge } from '@/components/status-badge'
import type { DashboardSurvey, DashboardStats, ResponseTrendDay } from './actions'

type DashboardData = {
  stats: DashboardStats
  recentSurveys: DashboardSurvey[]
  responseTrend: ResponseTrendDay[]
  topSurveys: { id: string; title: string; responseCount: number }[]
}

// ─── Stat Card ───
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  sub?: React.ReactNode
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconBg}`}>
            <Icon size={18} className={iconColor} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {sub && <div className="mt-2">{sub}</div>}
      </CardContent>
    </Card>
  )
}

// ─── Response Trend Summary ───
function ResponseChart({ data }: { data: ResponseTrendDay[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const average = data.length > 0 ? Math.round(total / data.length) : 0
  const peak = data.length > 0
    ? data.reduce((m, d) => (d.count > m.count ? d : m), data[0])
    : null

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3.5">
        <CardTitle className="text-sm font-semibold">Response Trend</CardTitle>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">Avg. / day</p>
            <p className="text-lg font-semibold">
              {average}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Peak</p>
            <p className="text-lg font-semibold">
              {peak?.date ?? '-'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="text-lg font-semibold text-primary">
              +{total}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Top Performing ───
function TopPerforming({
  surveys,
}: {
  surveys: { id: string; title: string; responseCount: number }[]
}) {
  const maxCount = Math.max(...surveys.map((s) => s.responseCount), 1)
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3.5">
        <CardTitle className="text-sm font-semibold">Top Performing</CardTitle>
        <span className="text-xs text-muted-foreground">By responses</span>
      </CardHeader>
      <CardContent className="p-5">
        {surveys.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No responses yet
          </p>
        ) : (
          <div className="space-y-4">
            {surveys.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                    i === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{s.title}</p>
                  <div className="mt-1 h-1 w-full rounded-full bg-muted">
                    <div
                      className="h-1 rounded-full bg-primary transition-all"
                      style={{ width: `${(s.responseCount / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums">
                  {s.responseCount}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Filter Tab ───
type Filter = 'all' | 'published' | 'draft' | 'closed'

function FilterTabs({
  active,
  onChange,
}: {
  active: Filter
  onChange: (f: Filter) => void
}) {
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Active' },
    { key: 'draft', label: 'Draft' },
  ]
  return (
    <div className="flex gap-1.5">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            active === f.key
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main Export ───
export function DashboardContent({ data }: { data: DashboardData }) {
  const { stats, recentSurveys, responseTrend, topSurveys } = data
  const [filter, setFilter] = useState<Filter>('all')

  const filtered =
    filter === 'all'
      ? recentSurveys
      : recentSurveys.filter((s) => s.status === filter)

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={IconLayoutList}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          label="Total Surveys"
          value={stats.totalSurveys}
        />
        <StatCard
          icon={IconUsers}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          label="Total Responses"
          value={stats.totalResponses}
          sub={
            stats.totalResponses > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <IconTrendingUp size={12} />
                Across all surveys
              </span>
            ) : undefined
          }
        />
        <StatCard
          icon={IconActivity}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Active Surveys"
          value={stats.activeSurveys}
          sub={
            stats.activeSurveys > 0 ? (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Live
              </span>
            ) : undefined
          }
        />
        <StatCard
          icon={IconTargetArrow}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          label="Active Rate"
          value={`${stats.publishedRate}%`}
        />
      </div>

      {/* ── Bottom: Table + Charts ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Table */}
        <Card className="shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Recent Surveys</h2>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                {filtered.length}
              </span>
            </div>
            <FilterTabs active={filter} onChange={setFilter} />
          </div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_80px_80px] gap-2 border-b bg-muted/40 px-5 py-2 text-[11px] font-medium text-muted-foreground">
            <span>Name</span>
            <span>Status</span>
            <span className="text-right">Responses</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconFileText size={32} className="text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === 'all'
                  ? 'No surveys yet. Create your first survey!'
                  : `No ${filter} surveys`}
              </p>
              {filter === 'all' && (
                <Button asChild size="sm" className="mt-3">
                  <Link href="/surveys/new">
                    <IconPlus size={14} />
                    Create Survey
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_90px_80px_80px] items-center gap-2 px-5 py-3 text-sm transition-colors hover:bg-muted/30"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
                      s.status === 'published'
                        ? 'bg-primary/10'
                        : s.status === 'draft'
                          ? 'bg-amber-50'
                          : 'bg-muted'
                    }`}>
                      <IconFileText
                        size={14}
                        className={
                          s.status === 'published'
                            ? 'text-primary'
                            : s.status === 'draft'
                              ? 'text-amber-600'
                              : 'text-muted-foreground'
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.questionCount} question{s.questionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <StatusBadge status={s.status} />

                  {/* Responses */}
                  <p className={`text-right text-[13px] tabular-nums ${
                    s.responseCount === 0 ? 'text-muted-foreground' : 'font-semibold'
                  }`}>
                    {s.responseCount}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {s.status === 'draft' && (
                      <>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/surveys/${s.id}/edit`} title="Edit">
                            <IconEdit size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/surveys/${s.id}`} title="Preview">
                            <IconEye size={14} />
                          </Link>
                        </Button>
                      </>
                    )}
                    {s.status === 'published' && (
                      <>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/surveys/${s.id}`} title="View results">
                            <IconChartBar size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={s.slug ? `/s/${s.slug}` : `/s/${s.id}`} target="_blank" title="Share">
                            <IconShare size={14} />
                          </Link>
                        </Button>
                      </>
                    )}
                    {s.status === 'closed' && (
                      <>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/surveys/${s.id}`} title="View results">
                            <IconChartBar size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Export">
                          <IconDownload size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="border-t px-5 py-2.5">
              <Link
                href="/surveys"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all surveys
              </Link>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          <ResponseChart data={responseTrend} />
          <TopPerforming surveys={topSurveys} />
        </div>
      </div>
    </div>
  )
}
