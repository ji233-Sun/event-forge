'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconLoader2,
  IconRefresh,
  IconRobot,
  IconTool,
  IconUsers,
  IconWand,
} from '@tabler/icons-react'

import { AgentModeSwitch } from '@/components/agent-task/agent-mode-switch'
import { AgentTaskWizard } from '@/components/agent-task/agent-task-wizard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CreationMode } from '@/lib/agent-tasks/types'
import type { GenerateMinitoolResult } from '@/lib/minitool-runtime/types'

import { createMinitool, getMinitoolById, updateMinitool } from '../actions'
import {
  buildMinitoolSaveRequest,
  getMinitoolEditorState,
  toEditableMinitoolResult,
} from './editor-state'

const MinitoolRenderer = dynamic(
  () => import('@/components/minitool-renderer').then((module) => module.MinitoolRenderer),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" /> },
)

type AgentTaskSession = {
  taskId: string
  turnId: string
  instructions: string
  skillUrl: string
  tokenExpiresAt: string | null
  status: 'waiting' | 'draft_ready' | 'expired'
}

type AgentTaskCreatePayload = {
  turnKind?: 'create' | 'iterate'
  feedback?: string
}

function getInitialMode(modeParam: string | null): CreationMode {
  return modeParam === 'agent' ? 'my_agent' : 'built_in_ai'
}

export default function NewMinitoolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const modeParam = searchParams.get('mode')

  const [mode, setMode] = useState<CreationMode>(getInitialMode(modeParam))
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isIterating, setIsIterating] = useState(false)
  const [isIssuingAgentTask, setIsIssuingAgentTask] = useState(false)
  const [isCancellingAgentTask, setIsCancellingAgentTask] = useState(false)
  const [result, setResult] = useState<GenerateMinitoolResult | null>(null)
  const [taskState, setTaskState] = useState<AgentTaskSession | null>(null)
  const [iterationFeedback, setIterationFeedback] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'audience' | 'host'>('audience')

  const editorState = getMinitoolEditorState({ editId, result, mode })
  const hasUnsavedAgentDraft = mode === 'my_agent' && taskState?.status === 'draft_ready'
  const canShowSaveAction = mode === 'built_in_ai' ? !!result : hasUnsavedAgentDraft
  const disableModeSwitch = !!result || !!taskState || isGenerating || isIterating || isSaving

  const previewBadge = useMemo(() => {
    if (mode === 'my_agent') {
      if (taskState?.status === 'waiting') {
        return {
          label: 'Waiting for agent draft',
          className: 'border-amber-200 bg-amber-500/5 text-amber-700',
        }
      }
      if (taskState?.status === 'expired') {
        return {
          label: 'Token expired',
          className: 'border-destructive/20 bg-destructive/10 text-destructive',
        }
      }
      if (taskState?.status === 'draft_ready') {
        return {
          label: 'Draft ready to save',
          className: 'border-green-200 bg-green-500/5 text-green-600',
        }
      }
    }

    return {
      label: 'Ready for review',
      className: 'border-green-200 bg-green-500/5 text-green-600',
    }
  }, [mode, taskState?.status])

  useEffect(() => {
    if (!editId) {
      setMode(getInitialMode(modeParam))
      return
    }

    getMinitoolById(editId).then((tool) => {
      if (!tool) {
        setError('Minitool not found.')
        return
      }

      setPrompt(tool.prompt)
      setName(tool.name)
      setMode(tool.creationMode ?? 'built_in_ai')
      setResult(
        toEditableMinitoolResult({
          name: tool.name,
          componentCode: tool.componentCode,
          hostCode: tool.hostCode,
        }),
      )
    })
  }, [editId, modeParam])

  useEffect(() => {
    if (mode !== 'my_agent' || !taskState?.taskId || taskState.status !== 'waiting') {
      return
    }

    let cancelled = false

    async function pollTask() {
      try {
        const response = await fetch(`/api/agent-tasks/${taskState.taskId}`)
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as {
          latestDraft?: GenerateMinitoolResult | null
        }

        if (cancelled || !data.latestDraft) {
          return
        }

        setResult(data.latestDraft)
        setName(data.latestDraft.suggestedName)
        setTaskState((current) =>
          current ? { ...current, status: 'draft_ready' } : current,
        )
      } catch {
        // Ignore transient polling failures and wait for the next cycle.
      }
    }

    void pollTask()
    const intervalId = window.setInterval(() => {
      void pollTask()
    }, 4_000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [mode, taskState?.taskId, taskState?.status])

  useEffect(() => {
    if (!taskState?.tokenExpiresAt || taskState.status !== 'waiting') {
      return
    }

    const expiresAt = new Date(taskState.tokenExpiresAt).getTime()
    const timeoutMs = Math.max(expiresAt - Date.now(), 0)

    const timeoutId = window.setTimeout(() => {
      setTaskState((current) => {
        if (!current || current.status !== 'waiting') {
          return current
        }

        return { ...current, status: 'expired' }
      })
    }, timeoutMs)

    return () => window.clearTimeout(timeoutId)
  }, [taskState?.tokenExpiresAt, taskState?.status])

  async function createAgentTask(payload: AgentTaskCreatePayload = {}) {
    const response = await fetch('/api/agent-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceKind: 'minitool',
        prompt,
        existingEntityId: editId,
        currentDraft: result,
        turnKind: payload.turnKind ?? 'create',
        feedback: payload.feedback ?? null,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        typeof data?.error === 'string' ? data.error : 'Unable to prepare the agent task.',
      )
    }

    setTaskState({
      taskId: data.taskId as string,
      turnId: data.turnId as string,
      instructions: data.agentInstructions as string,
      skillUrl: data.skillUrl as string,
      tokenExpiresAt: (data.tokenExpiresAt as string | null) ?? null,
      status: 'waiting',
    })
  }

  async function createAgentIterateTurn() {
    if (!taskState?.taskId) {
      throw new Error('Prepare the agent task before requesting an iteration.')
    }

    const response = await fetch(`/api/agent-tasks/${taskState.taskId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: iterationFeedback.trim() }),
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        typeof data?.error === 'string' ? data.error : 'Unable to create the iterate turn.',
      )
    }

    setTaskState({
      taskId: data.taskId as string,
      turnId: data.turnId as string,
      instructions: data.agentInstructions as string,
      skillUrl: data.skillUrl as string,
      tokenExpiresAt: (data.tokenExpiresAt as string | null) ?? null,
      status: 'waiting',
    })
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      return
    }

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/minitools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      setResult(data as GenerateMinitoolResult)
      setName((data as GenerateMinitoolResult).suggestedName)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleIterate() {
    if (!result || !iterationFeedback.trim()) {
      return
    }

    setIsIterating(true)
    setError('')

    try {
      const response = await fetch('/api/minitools/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: prompt,
          feedback: iterationFeedback,
          currentResult: result,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      setResult(data as GenerateMinitoolResult)
      setName((data as GenerateMinitoolResult).suggestedName)
      setIterationFeedback('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Iteration failed.')
    } finally {
      setIsIterating(false)
    }
  }

  async function handlePrepareAgentTask() {
    if (!prompt.trim()) {
      return
    }

    setIsIssuingAgentTask(true)
    setError('')

    try {
      await createAgentTask()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to prepare the agent task.')
    } finally {
      setIsIssuingAgentTask(false)
    }
  }

  async function handleAgentIterate() {
    if (!iterationFeedback.trim()) {
      return
    }

    setIsIterating(true)
    setError('')

    try {
      if (taskState?.taskId) {
        await createAgentIterateTurn()
      } else {
        await createAgentTask({
          turnKind: 'iterate',
          feedback: iterationFeedback.trim(),
        })
      }

      setIterationFeedback('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request the iteration.')
    } finally {
      setIsIterating(false)
    }
  }

  async function handleCopyInstructions() {
    if (!taskState?.instructions) {
      return
    }

    try {
      await navigator.clipboard.writeText(taskState.instructions)
    } catch {
      setError('Unable to copy the agent instructions.')
    }
  }

  async function handleCancelAgentTask() {
    if (!taskState?.taskId) {
      return
    }

    setIsCancellingAgentTask(true)
    setError('')

    try {
      const response = await fetch(`/api/agent-tasks/${taskState.taskId}/cancel`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      setTaskState(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to cancel the agent task.')
    } finally {
      setIsCancellingAgentTask(false)
    }
  }

  async function handleRefreshTask() {
    if (!taskState?.taskId) {
      return
    }

    setError('')

    try {
      const response = await fetch(`/api/agent-tasks/${taskState.taskId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error)
      }

      if (data.latestDraft) {
        const draft = data.latestDraft as GenerateMinitoolResult
        setResult(draft)
        setName(draft.suggestedName)
        setTaskState((current) =>
          current ? { ...current, status: 'draft_ready' } : current,
        )
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to refresh the task state.')
    }
  }

  async function handleSave() {
    if (!result || !name.trim()) {
      return
    }

    setIsSaving(true)

    try {
      if (mode === 'my_agent') {
        if (!taskState?.taskId || taskState.status !== 'draft_ready') {
          throw new Error('Wait for a draft from your agent before saving.')
        }

        const response = await fetch(`/api/agent-tasks/${taskState.taskId}/save`, {
          method: 'POST',
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error)
        }

        router.push(data.redirectTo as string)
        return
      }

      const request = buildMinitoolSaveRequest({
        editId,
        name: name.trim(),
        prompt,
        result,
      })

      if (request.mode === 'update') {
        await updateMinitool(request.input)
        router.push(`/minitools/${editId}`)
      } else {
        await createMinitool(request.input)
        router.push('/minitools')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed.')
      setIsSaving(false)
    }
  }

  const headerActions = canShowSaveAction ? (
    <Button
      onClick={handleSave}
      disabled={!name.trim() || isSaving || isIterating || isIssuingAgentTask}
      className="h-10 px-6"
    >
      {isSaving ? (
        <>
          <IconLoader2 size={18} className="mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <IconCheck size={18} className="mr-2" />
          {editorState.saveLabel}
        </>
      )}
    </Button>
  ) : null

  const modeSwitch = (
    <AgentModeSwitch
      value={mode}
      resourceKind="minitool"
      disabled={disableModeSwitch}
      onValueChange={setMode}
    />
  )

  const promptSection = (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          1. Prompt
        </CardTitle>
        <CardDescription>
          {mode === 'my_agent'
            ? 'Define the live experience that your external agent should build.'
            : 'Describe the first minitool draft you want EventForge to generate.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-sm font-medium">
            {editorState.promptLabel}
          </Label>
          <Textarea
            id="prompt"
            placeholder={editorState.promptPlaceholder}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            readOnly={editorState.isPromptLocked}
            className={cn(
              'min-h-[160px] resize-none border-border/60 bg-background',
              editorState.isPromptLocked && 'bg-muted/50',
            )}
          />
        </div>

        {editorState.isPromptLocked ? (
          <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {editorState.lockedPromptMessage}
          </p>
        ) : null}

        {mode === 'built_in_ai' && !editorState.isPromptLocked ? (
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full shadow-lg shadow-primary/10"
          >
            {isGenerating ? (
              <>
                <IconLoader2 size={18} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconWand size={18} className="mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <IconAlertCircle size={14} />
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )

  const agentSection = (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          2. Agent Task
        </CardTitle>
        <CardDescription>
          Share the task payload, shared skill, and token with your own agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <p className="text-sm font-medium">Shared skill</p>
          <a
            href={taskState?.skillUrl ?? '/eventforge-skill.md'}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            {taskState?.skillUrl ?? '/eventforge-skill.md'}
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Task ID</p>
            <p className="mt-1 text-sm font-medium">
              {taskState?.taskId ?? 'Create the task to get an ID'}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Token expires</p>
            <p className="mt-1 text-sm font-medium">
              {taskState?.tokenExpiresAt
                ? new Date(taskState.tokenExpiresAt).toLocaleString()
                : 'Not issued yet'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="agent-instructions" className="text-sm font-medium">
              Agent Instructions
            </Label>
            <Badge variant="outline" className={previewBadge.className}>
              {taskState?.status === 'draft_ready'
                ? 'Draft ready'
                : taskState?.status === 'expired'
                  ? 'Expired'
                  : taskState?.status === 'waiting'
                    ? 'Waiting'
                    : 'Not issued'}
            </Badge>
          </div>
          <Textarea
            id="agent-instructions"
            readOnly
            value={
              taskState?.instructions ??
              'Prepare the task to get a ready-to-copy instruction block for your external agent.'
            }
            className="min-h-[220px] resize-none border-border/60 bg-background font-mono text-xs"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={handlePrepareAgentTask}
            disabled={!prompt.trim() || isIssuingAgentTask || isSaving || isIterating}
            className="w-full"
          >
            {isIssuingAgentTask ? (
              <>
                <IconLoader2 size={18} className="mr-2 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <IconRobot size={18} className="mr-2" />
                {taskState ? 'Reissue Create Turn' : 'Prepare Agent Task'}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyInstructions}
            disabled={!taskState?.instructions}
            className="w-full"
          >
            <IconCopy size={18} className="mr-2" />
            Copy Instructions
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefreshTask}
            disabled={!taskState?.taskId}
            className="w-full"
          >
            <IconRefresh size={18} className="mr-2" />
            Refresh Status
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelAgentTask}
            disabled={!taskState?.taskId || isCancellingAgentTask}
            className="w-full"
          >
            {isCancellingAgentTask ? (
              <>
                <IconLoader2 size={18} className="mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Task'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const iterateSection = result ? (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {mode === 'my_agent' ? '3. Iterate' : '2. Iterate'}
        </CardTitle>
        <CardDescription>
          Describe bugs, UX issues, or follow-up improvements for the current draft.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="iteration-feedback" className="text-sm font-medium">
            What should change in the current result?
          </Label>
          <Textarea
            id="iteration-feedback"
            placeholder="e.g. Fix the host aggregation bug, improve empty states, and make the audience CTA more obvious."
            value={iterationFeedback}
            onChange={(event) => setIterationFeedback(event.target.value)}
            className="min-h-[140px] resize-none border-border/60 bg-background"
          />
        </div>
        <Button
          onClick={mode === 'my_agent' ? handleAgentIterate : handleIterate}
          disabled={!iterationFeedback.trim() || isIterating || isSaving || isIssuingAgentTask}
          className="w-full shadow-lg shadow-primary/10"
        >
          {isIterating ? (
            <>
              <IconLoader2 size={18} className="mr-2 animate-spin" />
              {mode === 'my_agent' ? 'Preparing Iterate Turn...' : 'Applying Iteration...'}
            </>
          ) : (
            <>
              <IconWand size={18} className="mr-2" />
              {mode === 'my_agent' ? 'Send Iteration to My Agent' : 'Refine Current Result'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  ) : null

  const identitySection = result ? (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {editorState.identityStepTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            {editorState.identityLabel}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={editorState.identityPlaceholder}
            className="border-border/60 bg-background"
          />
        </div>
      </CardContent>
    </Card>
  ) : null

  const previewSection =
    mode === 'built_in_ai' && isGenerating ? (
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
    ) : mode === 'my_agent' && taskState?.status === 'waiting' && !result ? (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconRobot size={32} />
        </div>
        <h3 className="mt-6 text-lg font-semibold">Waiting for your agent</h3>
        <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
          The preview will update automatically after your external agent submits a valid draft.
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
              <IconUsers size={14} />
              Audience View
            </Button>
            <Button
              variant={activeTab === 'host' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('host')}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <IconTool size={14} />
              Host View
            </Button>
          </div>
          <Badge variant="outline" className={previewBadge.className}>
            {previewBadge.label}
          </Badge>
        </div>

        <Card className="overflow-hidden border-border/40 shadow-xl shadow-black/5">
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
              onFixed={(fixedCode) => {
                if (activeTab === 'audience') {
                  setResult((current) =>
                    current ? { ...current, componentCode: fixedCode } : current,
                  )
                  return
                }

                setResult((current) =>
                  current ? { ...current, hostCode: fixedCode } : current,
                )
              }}
            />
          </CardContent>
        </Card>
      </div>
    ) : (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconTool size={32} />
        </div>
        <h3 className="mt-6 text-lg font-semibold">{editorState.previewEmptyTitle}</h3>
        <p className="mt-2 max-w-[320px] text-sm text-muted-foreground">
          {editorState.previewEmptyDescription}
        </p>
      </div>
    )

  return (
    <AgentTaskWizard
      state={editorState}
      headerActions={
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full transition-transform hover:-translate-x-0.5"
          >
            <Link href="/minitools">
              <IconArrowLeft size={20} />
            </Link>
          </Button>
          {headerActions}
        </div>
      }
      modeSwitch={modeSwitch}
      promptSection={promptSection}
      agentSection={agentSection}
      iterateSection={iterateSection}
      identitySection={identitySection}
      previewSection={previewSection}
    />
  )
}
