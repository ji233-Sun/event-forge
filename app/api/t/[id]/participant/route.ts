import { db } from '@/lib/db'
import { minitool, minitoolParticipant } from '@/lib/db/auth-schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const visitorId = new URL(request.url).searchParams.get('v')

  if (!visitorId || visitorId.length > 128) {
    return Response.json({ error: 'Invalid visitorId' }, { status: 400 })
  }

  const tool = await db.query.minitool.findFirst({
    where: eq(minitool.id, id),
    columns: { id: true },
  })
  if (!tool) return Response.json({ error: 'Not found' }, { status: 404 })

  const participant = await db.query.minitoolParticipant.findFirst({
    where: and(
      eq(minitoolParticipant.minitoolId, id),
      eq(minitoolParticipant.visitorId, visitorId),
    ),
  })

  return Response.json({ data: participant?.data ?? null })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { visitorId, data } = body as { visitorId?: unknown; data?: unknown }

  if (typeof visitorId !== 'string' || !visitorId || visitorId.length > 128) {
    return Response.json({ error: 'Invalid visitorId' }, { status: 400 })
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return Response.json({ error: 'data must be a plain object' }, { status: 400 })
  }

  if (JSON.stringify(data).length > 65536) {
    return Response.json({ error: 'data too large (max 64KB)' }, { status: 400 })
  }

  const tool = await db.query.minitool.findFirst({
    where: eq(minitool.id, id),
    columns: { id: true },
  })
  if (!tool) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.insert(minitoolParticipant)
    .values({
      id: crypto.randomUUID(),
      minitoolId: id,
      visitorId,
      data: data as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: [minitoolParticipant.minitoolId, minitoolParticipant.visitorId],
      set: { data: data as Record<string, unknown>, updatedAt: new Date() },
    })

  return Response.json({ ok: true })
}
