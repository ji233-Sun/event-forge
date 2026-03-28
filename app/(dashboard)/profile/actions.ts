'use server'

import { eq, and, count, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { survey, response } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type ProfileStats = {
  totalSurveys: number
  totalResponses: number
  activeSurveys: number
  publishedRate: number
}

export type SurveyStatusBreakdown = {
  draft: number
  published: number
  closed: number
}

export type ResponseTrendDay = {
  date: string
  count: number
}

export type RecentSurvey = {
  id: string
  title: string
  status: string
  createdAt: Date
  responseCount: number
}

export type ProfileData = {
  stats: ProfileStats
  statusBreakdown: SurveyStatusBreakdown
  responseTrend: ResponseTrendDay[]
  recentSurveys: RecentSurvey[]
}

export async function getProfileData(): Promise<ProfileData> {
  const user = await requireAuth()

  // --- Stats ---
  const [surveysResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(eq(survey.userId, user.id))

  const [responsesResult] = await db
    .select({ count: count() })
    .from(response)
    .innerJoin(survey, eq(response.surveyId, survey.id))
    .where(eq(survey.userId, user.id))

  // --- Status Breakdown (single grouped query) ---
  const statusCounts = await db
    .select({ status: survey.status, count: count() })
    .from(survey)
    .where(eq(survey.userId, user.id))
    .groupBy(survey.status)

  const statusMap = new Map(statusCounts.map((r) => [r.status, r.count]))

  const totalSurveys = surveysResult.count
  const totalResponses = responsesResult.count
  const activeSurveys = statusMap.get('published') ?? 0
  const publishedRate = totalSurveys > 0 ? Math.round((activeSurveys / totalSurveys) * 100) : 0

  // --- Response Trend (last 7 days) ---
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const trendRows = await db
    .select({
      date: sql<string>`${response.createdAt}::date`.as('date'),
      count: count(),
    })
    .from(response)
    .innerJoin(survey, eq(response.surveyId, survey.id))
    .where(and(eq(survey.userId, user.id), sql`${response.createdAt} >= ${sevenDaysAgo.toISOString()}::timestamptz`))
    .groupBy(sql`${response.createdAt}::date`)
    .orderBy(sql`${response.createdAt}::date`)

  const trendMap = new Map(trendRows.map((r) => [r.date, r.count]))
  const responseTrend: ResponseTrendDay[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    responseTrend.push({
      date: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
      count: trendMap.get(key) ?? 0,
    })
  }

  // --- Recent Surveys ---
  const recentRows = await db.query.survey.findMany({
    where: eq(survey.userId, user.id),
    orderBy: desc(survey.createdAt),
    limit: 5,
    with: {
      responses: { columns: { id: true } },
    },
  })

  const recentSurveys: RecentSurvey[] = recentRows.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    createdAt: s.createdAt,
    responseCount: s.responses.length,
  }))

  return {
    stats: { totalSurveys, totalResponses, activeSurveys, publishedRate },
    statusBreakdown: { draft: statusMap.get('draft') ?? 0, published: activeSurveys, closed: statusMap.get('closed') ?? 0 },
    responseTrend,
    recentSurveys,
  }
}
