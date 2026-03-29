import { db } from '@/lib/db'
import { minitool, minitoolShared } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const tool = await db.query.minitool.findFirst({
    where: eq(minitool.id, id),
    columns: { id: true },
  })
  if (!tool) return Response.json({ error: 'Not found' }, { status: 404 })

  const shared = await db.query.minitoolShared.findFirst({
    where: eq(minitoolShared.minitoolId, id),
  })

  return Response.json({ data: shared?.data ?? null })
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

  const { data } = body as { data?: unknown }

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

  await db.insert(minitoolShared)
    .values({ minitoolId: id, data: data as Record<string, unknown> })
    .onConflictDoUpdate({
      target: minitoolShared.minitoolId,
      set: { data: data as Record<string, unknown>, updatedAt: new Date() },
    })

  return Response.json({ ok: true })
}
