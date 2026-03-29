/**
 * Proxy route for serving R2 media assets (poster images, audio) with authentication.
 *
 * URL:  GET /api/media/media/{userId}/{filename}
 * Auth: session.userId must match the {userId} segment in the key.
 */

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { r2GetStream } from '@/lib/r2'

interface RouteContext {
  params: Promise<{ path: string[] }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { path } = await params
  // Expected key structure: media/{userId}/{filename}
  const key = path.join('/')
  const keyUserId = path[1] // path[0] = "media", path[1] = userId

  if (!keyUserId || keyUserId !== session.user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  const result = await r2GetStream(key)
  if (!result) {
    return new Response('Not Found', { status: 404 })
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
