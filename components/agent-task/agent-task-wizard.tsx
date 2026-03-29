'use client'

import type { ReactNode } from 'react'
import { IconCheck } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { AgentTaskWizardState } from './agent-task-state'

type AgentTaskWizardProps = {
  state: AgentTaskWizardState
  headerActions?: ReactNode
  modeSwitch?: ReactNode
  promptSection: ReactNode
  agentSection?: ReactNode
  iterateSection?: ReactNode
  identitySection?: ReactNode
  previewSection: ReactNode
  leftFooter?: ReactNode
  className?: string
}

export function AgentTaskWizard({
  state,
  headerActions,
  modeSwitch,
  promptSection,
  agentSection,
  iterateSection,
  identitySection,
  previewSection,
  leftFooter,
  className,
}: AgentTaskWizardProps) {
  return (
    <div className={cn('min-h-full bg-background/50', className)}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{state.title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {state.description}
            </p>
          </div>
          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <Card className="border-border/40 shadow-sm">
              <CardHeader className="gap-2 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Flow Overview
                </CardTitle>
                <CardDescription>
                  Keep the prompt, review loop, and final save action aligned across built-in AI and external agents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {state.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/70 px-4 py-3"
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                        step.status === 'complete' &&
                          'border-primary/20 bg-primary text-primary-foreground',
                        step.status === 'current' &&
                          'border-primary/30 bg-primary/10 text-primary',
                        step.status === 'upcoming' &&
                          'border-border/60 bg-muted/40 text-muted-foreground',
                      )}
                    >
                      {step.status === 'complete' ? (
                        <IconCheck size={14} />
                      ) : (
                        step.title.split('.')[0]
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{step.title}</p>
                        <Badge
                          variant="outline"
                          className="border-border/60 bg-background text-[10px] uppercase tracking-wide text-muted-foreground"
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {state.showModeSwitch && modeSwitch ? modeSwitch : null}
            {promptSection}
            {state.showAgentStep ? agentSection : null}
            {state.showIterateSection ? iterateSection : null}
            {state.showIdentitySection ? identitySection : null}
            {leftFooter}
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-6 lg:sticky lg:top-6">{previewSection}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
