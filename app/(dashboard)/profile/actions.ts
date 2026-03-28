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
  responseRate: number
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

  const [activeResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(and(eq(survey.userId, user.id), eq(survey.status, 'published')))

  const totalSurveys = surveysResult.count
  const totalResponses = responsesResult.count
  const activeSurveys = activeResult.count
  const responseRate = totalSurveys > 0 ? Math.round((activeSurveys / totalSurveys) * 100) : 0

  // --- Status Breakdown ---
  const [draftResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(and(eq(survey.userId, user.id), eq(survey.status, 'draft')))

  const [closedResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(and(eq(survey.userId, user.id), eq(survey.status, 'closed')))

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
    stats: { totalSurveys, totalResponses, activeSurveys, responseRate },
    statusBreakdown: { draft: draftResult.count, published: activeResult.count, closed: closedResult.count },
    responseTrend,
    recentSurveys,
  }
}
