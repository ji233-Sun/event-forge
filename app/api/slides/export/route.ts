/**
 * POST /api/slides/export
 * Server-side PDF / PPTX export — fetches images directly from R2,
 * generates the file, and streams it to the client.
 * Heavy lifting happens on the server; the browser main thread stays free.
 */

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { deck } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import { isPlainObject } from '@/lib/api-utils'
import { r2GetBuffer, proxyUrlToR2Key } from '@/lib/r2'

type ImageBuffer = { buffer: Buffer; contentType: string }

// ── PDF ───────────────────────────────────────────────────────────────────────

async function buildPdf(images: ImageBuffer[], title: string): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle(title)

  // 16:9 in points (1 pt = 1/72 inch; 13.33" × 7.5" = 960 × 540 pt)
  const W = 960, H = 540

  for (const { buffer, contentType } of images) {
    const page = doc.addPage([W, H])
    const img = contentType.includes('jpeg') || contentType.includes('jpg')
      ? await doc.embedJpg(buffer)
      : await doc.embedPng(buffer)
    page.drawImage(img, { x: 0, y: 0, width: W, height: H })
  }

  return doc.save()
}

// ── PPTX ──────────────────────────────────────────────────────────────────────

async function buildPptx(images: ImageBuffer[], title: string): Promise<Buffer> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33" × 7.5" (16:9)
  pptx.title = title

  for (const { buffer, contentType } of images) {
    const slide = pptx.addSlide()
    slide.addImage({
      data: `data:${contentType};base64,${buffer.toString('base64')}`,
      x: 0, y: 0, w: '100%', h: '100%',
    })
  }

  return pptx.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!isPlainObject(body)) return new Response('Invalid body', { status: 400 })

  const { deckId, format } = body as { deckId?: string; format?: string }

  if (typeof deckId !== 'string' || !deckId) {
    return new Response('deckId required', { status: 400 })
  }
  if (format !== 'pdf' && format !== 'pptx') {
    return new Response('format must be pdf or pptx', { status: 400 })
  }

  // Verify ownership
  const [row] = await db.select().from(deck).where(eq(deck.id, deckId))
  if (!row || row.userId !== session.user.id) {
    return new Response('Not found', { status: 404 })
  }
  if (row.mode !== 'image' || !row.images?.length) {
    return new Response('No images in this deck', { status: 422 })
  }

  // Fetch all images from R2 in order
  const imageBuffers: ImageBuffer[] = []
  for (const img of [...row.images].sort((a, b) => a.index - b.index)) {
    const key = proxyUrlToR2Key(img.url)
    if (!key) continue
    const result = await r2GetBuffer(key)
    if (result) imageBuffers.push(result)
  }

  if (imageBuffers.length === 0) {
    return new Response('Failed to load images from storage', { status: 502 })
  }

  const safeTitle = row.title.replace(/[\\/:*?"<>|]/g, '-').trim() || 'slide-deck'

  try {
    if (format === 'pdf') {
      const bytes = await buildPdf(imageBuffers, row.title)
      return new Response(Buffer.from(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        },
      })
    } else {
      const buf = await buildPptx(imageBuffers, row.title)
      return new Response(buf as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${safeTitle}.pptx"`,
        },
      })
    }
  } catch (err) {
    console.error('[slides/export] generation failed:', err)
    return new Response('Export failed', { status: 500 })
  }
}
