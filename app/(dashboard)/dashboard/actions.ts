'use server'

import { eq, and, count, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { survey, question, response } from '@/lib/db/auth-schema'
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
  avgResponseRate: number
}

export async function getDashboardData() {
  const user = await requireAuth()

  // --- Stats ---
  const [totalSurveysResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(eq(survey.userId, user.id))

  const [totalResponsesResult] = await db
    .select({ count: count() })
    .from(response)
    .innerJoin(survey, eq(response.surveyId, survey.id))
    .where(eq(survey.userId, user.id))

  const [activeSurveysResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(and(eq(survey.userId, user.id), eq(survey.status, 'published')))

  // Surveys with at least 1 question => "complete" survey
  const [completeSurveysResult] = await db
    .select({ count: count() })
    .from(survey)
    .where(eq(survey.userId, user.id))

  const totalSurveys = totalSurveysResult.count
  const totalResponses = totalResponsesResult.count
  const activeSurveys = activeSurveysResult.count
  const avgResponseRate =
    totalSurveys > 0
      ? Math.round((activeSurveys / totalSurveys) * 100)
      : 0

  const stats: DashboardStats = {
    totalSurveys,
    totalResponses,
    activeSurveys,
    avgResponseRate,
  }

  // --- Recent Surveys ---
  const surveys = await db.query.survey.findMany({
    where: eq(survey.userId, user.id),
    orderBy: desc(survey.createdAt),
    limit: 10,
    with: {
      questions: { columns: { id: true } },
      responses: { columns: { id: true }, orderBy: desc(response.createdAt), limit: 1 },
    },
  })

  const recentSurveys: DashboardSurvey[] = surveys.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    slug: s.slug,
    createdAt: s.createdAt,
    questionCount: s.questions.length,
    responseCount: s.responses.length,
  }))

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

  // Fill missing days with 0
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

  // --- Top Performing ---
  const topSurveys = await db
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
    .limit(3)

  return { stats, recentSurveys, responseTrend, topSurveys }
}
