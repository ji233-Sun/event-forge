/**
 * Client-side export helpers — delegate all generation work to the server.
 * The browser main thread only sends one fetch request and triggers a download.
 */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function callExportApi(deckId: string, format: 'pdf' | 'pptx'): Promise<Blob> {
  const res = await fetch('/api/slides/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deckId, format }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'Export failed')
    throw new Error(text)
  }
  return res.blob()
}

export async function exportToPdf(deckId: string, deckTitle: string): Promise<void> {
  const blob = await callExportApi(deckId, 'pdf')
  const filename = deckTitle.replace(/[\\/:*?"<>|]/g, '-').trim() || 'slide-deck'
  triggerDownload(blob, `${filename}.pdf`)
}

export async function exportToPptx(deckId: string, deckTitle: string): Promise<void> {
  const blob = await callExportApi(deckId, 'pptx')
  const filename = deckTitle.replace(/[\\/:*?"<>|]/g, '-').trim() || 'slide-deck'
  triggerDownload(blob, `${filename}.pptx`)
}
