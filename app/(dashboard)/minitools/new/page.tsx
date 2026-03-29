'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader2,
  IconWand,
  IconCheck,
  IconArrowLeft,
  IconTool,
  IconUsers,
  IconAlertCircle,
  IconSparkles,
} from '@tabler/icons-react'
import { createMinitool } from '../actions'
import type { GenerateMinitoolResult } from '@/lib/minitool-runtime/types'

const MinitoolRenderer = dynamic(
  () => import('@/components/minitool-renderer').then((m) => m.MinitoolRenderer),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" /> },
)

export default function NewMinitoolPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerateMinitoolResult | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'audience' | 'host'>('audience')

  async function handleGenerate() {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/minitools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data as GenerateMinitoolResult)
      setName(data.suggestedName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!result || !name.trim()) return
    setIsSaving(true)
    try {
      await createMinitool({
        name: name.trim(),
        prompt,
        componentCode: result.componentCode,
        hostCode: result.hostCode,
      })
      router.push('/minitools')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-background/50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full transition-transform hover:-translate-x-0.5">
              <Link href="/minitools"><IconArrowLeft size={20} /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create Minitool</h1>
              <p className="text-sm text-muted-foreground">Describe your tool — AI handles the rest.</p>
            </div>
          </div>
          {result && (
            <Button onClick={handleSave} disabled={!name.trim() || isSaving} className="h-10 px-6">
              {isSaving ? (
                <><IconLoader2 size={18} className="mr-2 animate-spin" />Saving...</>
              ) : (
                <><IconCheck size={18} className="mr-2" />Save Minitool</>
              )}
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left: prompt + name */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="overflow-hidden border-border/40 shadow-sm">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    1. The Prompt
                  </CardTitle>
                  <IconSparkles size={16} className="text-primary/60" />
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-sm font-medium">What should this tool do?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g. A live emoji reaction wall where audience members pick their mood..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[160px] resize-none border-border/60 bg-background"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full shadow-lg shadow-primary/10"
                >
                  {isGenerating ? (
                    <><IconLoader2 size={18} className="mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><IconWand size={18} className="mr-2" />{result ? 'Regenerate' : 'Generate with AI'}</>
                  )}
                </Button>
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    <IconAlertCircle size={14} />{error}
                  </div>
                )}
              </CardContent>
            </Card>

            {result && (
              <Card className="overflow-hidden border-border/40 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Name
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Minitool Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Emoji Reaction Wall"
                      className="border-border/60 bg-background"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: preview */}
          <div className="lg:col-span-7">
            {isGenerating ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <IconWand size={32} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">AI is building your minitool</h3>
                <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
                  Crafting the audience component and host view...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
                    <Button
                      variant={activeTab === 'audience' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('audience')}
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <IconUsers size={14} />Audience View
                    </Button>
                    <Button
                      variant={activeTab === 'host' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('host')}
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <IconTool size={14} />Host View
                    </Button>
                  </div>
                  <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200">
                    Ready
                  </Badge>
                </div>
                <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {activeTab === 'audience' ? 'Audience Component (Preview)' : 'Host View (Preview)'}
                    </span>
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-border" />
                      <div className="h-2 w-2 rounded-full bg-border" />
                      <div className="h-2 w-2 rounded-full bg-border" />
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <MinitoolRenderer
                      code={activeTab === 'audience' ? result.componentCode : result.hostCode}
                      minitoolId="preview"
                      mode={activeTab === 'audience' ? 'preview-audience' : 'preview-host'}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <IconTool size={32} />
                </div>
                <h3 className="mt-6 text-lg font-semibold">Live Preview</h3>
                <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
                  Your minitool components will appear here after generation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
