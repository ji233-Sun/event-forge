'use client'

import { IconExternalLink, IconSparkles } from '@tabler/icons-react'

import { EVENTFORGE_SKILL_URL } from '@/lib/agent-tasks/skill'
import type {
  AgentTaskResourceKind,
  CreationMode,
} from '@/lib/agent-tasks/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { getAgentTaskCopy } from './agent-task-state'

type AgentModeSwitchProps = {
  value: CreationMode
  resourceKind: AgentTaskResourceKind
  onValueChange: (value: CreationMode) => void
  disabled?: boolean
  className?: string
  skillUrl?: string
}

export function AgentModeSwitch({
  value,
  resourceKind,
  onValueChange,
  disabled = false,
  className,
  skillUrl = EVENTFORGE_SKILL_URL,
}: AgentModeSwitchProps) {
  const copy = getAgentTaskCopy(resourceKind)
  const isMyAgent = value === 'my_agent'

  return (
    <Card className={cn('border-border/40 shadow-sm', className)}>
      <CardHeader className="gap-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <IconSparkles size={16} className="text-primary/70" />
              Mode
            </CardTitle>
            <CardDescription>
              Choose whether EventForge drafts the {copy.singularName.toLowerCase()} directly or hands the task to your own agent.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-border/60 bg-background">
            {isMyAgent ? 'My Agent' : 'Built-in AI'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-background/70 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Built-in AI</p>
            <p className="text-xs text-muted-foreground">
              Use the EventForge generation flow for the first draft.
            </p>
          </div>
          <Switch
            checked={isMyAgent}
            disabled={disabled}
            aria-label="Toggle agent mode"
            onCheckedChange={(checked) =>
              onValueChange(checked ? 'my_agent' : 'built_in_ai')
            }
          />
          <div className="space-y-1 text-right">
            <p className="text-sm font-medium">My Agent</p>
            <p className="text-xs text-muted-foreground">
              Use the shared skill and submit the draft back into EventForge.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant={isMyAgent ? 'outline' : 'secondary'}
            disabled={disabled}
            className="justify-start"
            onClick={() => onValueChange('built_in_ai')}
          >
            Built-in AI
          </Button>
          <Button
            type="button"
            variant={isMyAgent ? 'secondary' : 'outline'}
            disabled={disabled}
            className="justify-start"
            onClick={() => onValueChange('my_agent')}
          >
            My Agent
          </Button>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <p className="text-sm font-medium">
            {isMyAgent
              ? 'Your external agent will receive an EventForge task brief.'
              : 'EventForge will generate the first draft inside this editor.'}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isMyAgent
              ? `Share the prompt, the task read endpoint, and the shared skill so your agent can return a valid ${copy.singularName.toLowerCase()} draft payload.`
              : `Use the built-in AI flow when you want the fastest path to a working ${copy.singularName.toLowerCase()} draft.`}
          </p>
          {isMyAgent ? (
            <a
              href={skillUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              Open shared skill
              <IconExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
