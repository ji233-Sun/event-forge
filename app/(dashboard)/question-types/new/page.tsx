'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  IconLoader2, 
  IconWand, 
  IconCheck, 
  IconArrowLeft, 
  IconEye, 
  IconDeviceDesktop, 
  IconCode,
  IconSparkles,
  IconAlertCircle
} from '@tabler/icons-react'
import Link from 'next/link'
import { CustomQuestionRenderer } from '@/app/(dashboard)/surveys/[surveyId]/components/custom-question-renderer'
import { createCustomType, getCustomTypeById } from '../actions'
import type { GenerateCustomTypeResult } from '@/lib/question-runtime/types'
import { cn } from '@/lib/utils'

export default function NewQuestionTypePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerateCustomTypeResult | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [previewValue, setPreviewValue] = useState<unknown>(undefined)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

  // Load existing type if editing/viewing
  useEffect(() => {
    if (editId) {
      getCustomTypeById(editId).then((type) => {
        if (type) {
          setPrompt(type.prompt)
          setName(type.name)
          setResult({
            formCode: type.formCode,
            displayCode: type.displayCode,
            answerSchema: type.answerSchema as any,
            suggestedName: type.name,
          })
        }
      })
    }
  }, [editId])

  async function handleGenerate() {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError('')
    // Keep old result while generating for smoother transition or clear it? 
    // Let's clear it to show the loading state clearly
    setResult(null)

    try {
      const res = await fetch('/api/question-types/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data as GenerateCustomTypeResult)
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
      await createCustomType({
        name: name.trim(),
        prompt,
        formCode: result.formCode,
        displayCode: result.displayCode,
        answerSchema: result.answerSchema,
      })
      router.push('/question-types')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-background/50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Breadcrumbs & Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full transition-transform hover:-translate-x-0.5">
              <Link href="/question-types">
                <IconArrowLeft size={20} />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {editId ? 'Question Type Details' : 'Create Question Type'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {editId ? 'View or refine your custom question type.' : 'Describe your vision, AI handles the rest.'}
              </p>
            </div>
          </div>
          {result && !editId && (
            <Button onClick={handleSave} disabled={!name.trim() || isSaving} className="h-10 px-6">
              {isSaving ? (
                <>
                  <IconLoader2 size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck size={18} className="mr-2" />
                  Save to Library
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Input & Controls */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="overflow-hidden border-border/40 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    1. The Prompt
                  </CardTitle>
                  <IconSparkles size={16} className="text-primary/60" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-sm font-medium">What should this question collect?</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g. A visual slider for rating energy levels with a comment box..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      readOnly={!!editId}
                      className={cn(
                        "min-h-[160px] resize-none border-border/60 bg-background focus:ring-primary/20",
                        editId && "bg-muted/50"
                      )}
                    />
                  </div>
                  {!editId && (
                    <Button 
                      onClick={handleGenerate} 
                      disabled={!prompt.trim() || isGenerating}
                      className="w-full shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                    >
                      {isGenerating ? (
                        <>
                          <IconLoader2 size={18} className="mr-2 animate-spin" />
                          Generating Component...
                        </>
                      ) : (
                        <>
                          <IconWand size={18} className="mr-2" />
                          {result ? 'Refine with AI' : 'Generate with AI'}
                        </>
                      )}
                    </Button>
                  )}
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <IconAlertCircle size={14} />
                      {error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card className="overflow-hidden border-border/40 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Type Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        readOnly={!!editId}
                        placeholder="e.g. Energy Rating Slider"
                        className={cn(
                          "border-border/60 bg-background focus:ring-primary/20",
                          editId && "bg-muted/50"
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Preview Area */}
          <div className="lg:col-span-7">
            {isGenerating ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <IconWand size={32} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">AI is building your component</h3>
                <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
                  Crafting the UI, logic, and schema based on your description...
                </p>
                <div className="mt-8 w-full max-w-[200px] space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full w-1/3 animate-progress rounded-full bg-primary"></div>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
                    <Button 
                      variant={activeTab === 'preview' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setActiveTab('preview')}
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <IconDeviceDesktop size={14} />
                      Preview
                    </Button>
                    <Button 
                      variant={activeTab === 'code' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setActiveTab('code')}
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <IconCode size={14} />
                      Schema
                    </Button>
                  </div>
                  <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200">
                    Ready for use
                  </Badge>
                </div>

                {activeTab === 'preview' ? (
                  <div className="grid gap-6">
                    <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Interactive Form</span>
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-border"></div>
                          <div className="h-2 w-2 rounded-full bg-border"></div>
                          <div className="h-2 w-2 rounded-full bg-border"></div>
                        </div>
                      </div>
                      <CardContent className="p-8">
                        <CustomQuestionRenderer
                          code={result.formCode}
                          mode="form"
                          value={previewValue}
                          onChange={setPreviewValue}
                          question={{ title: 'Preview Question', description: 'Test the interactivity below' }}
                          onFixed={(fixedCode) => setResult((prev) => prev ? { ...prev, formCode: fixedCode } : prev)}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-lg shadow-black/5 overflow-hidden">
                      <div className="border-b border-border/40 bg-muted/20 px-4 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Result Display</span>
                      </div>
                      <CardContent className="p-8">
                        <div className="rounded-xl border border-dashed border-border/60 p-6 bg-muted/5">
                          <CustomQuestionRenderer
                            code={result.displayCode}
                            mode="display"
                            answer={previewValue}
                            onFixed={(fixedCode) => setResult((prev) => prev ? { ...prev, displayCode: fixedCode } : prev)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-border/40 shadow-lg shadow-black/5 bg-slate-950 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">JSON Schema</span>
                      <Button variant="ghost" size="sm" className="h-7 text-white/60 hover:text-white" onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(result.answerSchema, null, 2))
                      }}>
                        Copy
                      </Button>
                    </div>
                    <CardContent className="p-0">
                      <pre className="p-6 text-xs text-indigo-300 overflow-auto max-h-[500px]">
                        {JSON.stringify(result.answerSchema, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <IconEye size={32} />
                </div>
                <h3 className="mt-6 text-lg font-semibold">Live Preview</h3>
                <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
                  Your custom question will appear here as soon as you hit generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
