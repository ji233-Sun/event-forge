/**
 * Cloudflare R2 SDK wrapper (S3-compatible)
 *
 * Key convention: slides/{userId}/{uuid}.{ext}
 * Access is always proxied through /api/slides/image/[...path] — never expose R2 URLs directly.
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
