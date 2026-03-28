'use server'

import { eq, and, count, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { survey, response } from '@/lib/db/auth-schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type DashboardSurvey = {
  id: string
  title: string
  status: string
  slug: string | null
  createdAt: Date
  questionCount: number
  responseCount: number
}

export type ResponseTrendDay = {
  date: string
  count: number
}

export type DashboardStats = {
  totalSurveys: number
  totalResponses: number
  activeSurveys: number
  publishedRate: number
}

export async function getDashboardData() {
  const user = await requireAuth()

  const now = new Date()
  const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6))

  // Run all independent queries in parallel
  const [statusCounts, [totalResponsesResult], recentSurveysRaw, trendRows, topSurveys] = await Promise.all([
    // Stats: survey counts grouped by status (replaces 2 separate count queries)
    db
      .select({ status: survey.status, count: count() })
      .from(survey)
      .where(eq(survey.userId, user.id))
      .groupBy(survey.status),

    // Stats: total responses
    db
      .select({ count: count() })
      .from(response)
      .innerJoin(survey, eq(response.surveyId, survey.id))
      .where(eq(survey.userId, user.id)),

    // Recent surveys
    db.query.survey.findMany({
      where: eq(survey.userId, user.id),
      orderBy: desc(survey.createdAt),
      limit: 10,
      with: {
        questions: { columns: { id: true } },
        responses: { columns: { id: true } },
      },
    }),

    // Response trend (last 7 days, UTC-normalized)
    db
      .select({
        date: sql<string>`(${response.createdAt} AT TIME ZONE 'UTC')::date`.as('date'),
        count: count(),
      })
      .from(response)
      .innerJoin(survey, eq(response.surveyId, survey.id))
      .where(and(eq(survey.userId, user.id), sql`${response.createdAt} >= ${sevenDaysAgo.toISOString()}::timestamptz`))
      .groupBy(sql`(${response.createdAt} AT TIME ZONE 'UTC')::date`)
      .orderBy(sql`(${response.createdAt} AT TIME ZONE 'UTC')::date`),

    // Top performing surveys
    db
      .select({
        id: survey.id,
        title: survey.title,
        responseCount: count(),
      })
      .from(survey)
      .innerJoin(response, eq(response.surveyId, survey.id))
      .where(eq(survey.userId, user.id))
      .groupBy(survey.id, survey.title)
      .orderBy(desc(count()))
      .limit(3),
  ])

  // Derive stats from grouped status counts
  const statusMap = new Map(statusCounts.map((r) => [r.status, r.count]))
  const totalSurveys = statusCounts.reduce((sum, r) => sum + r.count, 0)
  const activeSurveys = statusMap.get('published') ?? 0
  const totalResponses = totalResponsesResult.count
  const publishedRate = totalSurveys > 0 ? Math.round((activeSurveys / totalSurveys) * 100) : 0

  const stats: DashboardStats = { totalSurveys, totalResponses, activeSurveys, publishedRate }

  // Map recent surveys
  const recentSurveys: DashboardSurvey[] = recentSurveysRaw.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    slug: s.slug,
    createdAt: s.createdAt,
    questionCount: s.questions.length,
    responseCount: s.responses.length,
  }))

  // Fill missing days with 0
  const trendMap = new Map(trendRows.map((r) => [r.date, r.count]))
  const responseTrend: ResponseTrendDay[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    const key = d.toISOString().slice(0, 10)
    responseTrend.push({
      date: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(d),
      count: trendMap.get(key) ?? 0,
    })
  }

  return { stats, recentSurveys, responseTrend, topSurveys }
}
