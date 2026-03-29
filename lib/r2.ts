/**
 * Cloudflare R2 SDK wrapper (S3-compatible)
 *
 * Key conventions:
 *   slides/{userId}/{uuid}.{ext}  — slide images, proxied via /api/slides/image/[...path]
 *   media/{userId}/{uuid}.{ext}   — multimedia assets (poster images, audio), proxied via /api/media/[...path]
 *
 * Never expose R2 URLs directly; always proxy through the auth-gated routes.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME
  if (!bucket) throw new Error('Missing R2_BUCKET_NAME')
  return bucket
}

/**
 * Upload a binary buffer to R2.
 * @param key    Object key, e.g. `slides/{userId}/{uuid}.png`
 * @param body   Raw image bytes
 * @param contentType  MIME type, e.g. `image/png`
 */
export async function r2Upload(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

/**
 * Download a full object from R2 into a Buffer (for server-side processing).
 * Returns null if the object does not exist or an error occurs.
 */
export async function r2GetBuffer(
  key: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    )
    if (!res.Body) return null
    const bytes = await res.Body.transformToByteArray()
    return {
      buffer: Buffer.from(bytes),
      contentType: res.ContentType ?? 'application/octet-stream',
    }
  } catch {
    return null
  }
}

/**
 * Stream an object from R2.
 * Returns null if the object does not exist or an error occurs.
 */
export async function r2GetStream(
  key: string,
): Promise<{ stream: ReadableStream; contentType: string } | null> {
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    )
    if (!res.Body) return null
    return {
      stream: res.Body.transformToWebStream(),
      contentType: res.ContentType ?? 'application/octet-stream',
    }
  } catch {
    return null
  }
}

/**
 * Delete a single object from R2.
 */
export async function r2Delete(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  )
}

/**
 * Batch-delete up to 1000 objects in one request.
 */
export async function r2DeleteMany(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await getClient().send(
    new DeleteObjectsCommand({
      Bucket: getBucket(),
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    }),
  )
}

/**
 * Derive the app-internal proxy URL from an R2 key.
 * e.g. `slides/abc/xyz.png` → `/api/slides/image/slides/abc/xyz.png`
 */
export function r2KeyToProxyUrl(key: string): string {
  return `/api/slides/image/${key}`
}

/**
 * Extract the R2 key from a proxy URL.
 * e.g. `/api/slides/image/slides/abc/xyz.png` → `slides/abc/xyz.png`
 * Returns null if the URL doesn't match the expected prefix.
 */
export function proxyUrlToR2Key(url: string): string | null {
  const prefix = '/api/slides/image/'
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

/**
 * Derive the app-internal proxy URL from a media R2 key.
 * e.g. `media/abc/xyz.png` → `/api/media/media/abc/xyz.png`
 */
export function r2KeyToMediaProxyUrl(key: string): string {
  return `/api/media/${key}`
}

/**
 * Extract the R2 key from a media proxy URL.
 * e.g. `/api/media/media/abc/xyz.mp3` → `media/abc/xyz.mp3`
 * Returns null if the URL doesn't match the expected prefix.
 */
export function mediaProxyUrlToR2Key(url: string): string | null {
  const prefix = '/api/media/'
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

/**
 * Parse a base64 data URL into a Buffer and mediaType.
 * e.g. `data:image/png;base64,iVBORw0K...` → { buffer, mediaType: 'image/png' }
 */
export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mediaType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid data URL: expected data:<mediaType>;base64,<data>')
  }
  return {
    mediaType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}
