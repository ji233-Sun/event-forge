import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { type NextRequest } from 'next/server'

const handler = toNextJsHandler(auth)

export async function GET(req: NextRequest) {
  console.log('[auth route] GET', req.nextUrl.pathname + req.nextUrl.search)
  return handler.GET(req)
}

export async function POST(req: NextRequest) {
  console.log('[auth route] POST', req.nextUrl.pathname)
  return handler.POST(req)
}
