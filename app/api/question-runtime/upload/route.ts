import { r2Upload, r2KeyToProxyUrl } from '@/lib/r2'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'audio/mpeg', 'audio/wav',
]

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'file field is required.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File must be 10MB or smaller.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: `File type ${file.type} is not allowed.` }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const key = `question-uploads/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2Upload(key, buffer, file.type)

  return Response.json({ fileUrl: r2KeyToProxyUrl(key) })
}
