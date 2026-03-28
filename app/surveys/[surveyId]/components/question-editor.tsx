'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  IconGripVertical,
  IconTrash,
  IconPlus,
  IconX,
} from '@tabler/icons-react'

export type QuestionData = {
  id: string
  type: string
  title: string
  description: string
  required: boolean
  options: string[]
  order: number
}

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating' },
  { value: 'dropdown', label: 'Dropdown' },
] as const

function hasOptions(type: string) {
  return type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown'
}

export function QuestionEditor({
  question,
  onChange,
  onDelete,
}: {
  question: QuestionData
  onChange: (updated: QuestionData) => void
  onDelete: () => void
}) {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...question.options]
    newOptions[index] = value
    onChange({ ...question, options: newOptions })
  }

  const addOption = () => {
    onChange({ ...question, options: [...question.options, `Option ${question.options.length + 1}`] })
  }

  const removeOption = (index: number) => {
    onChange({ ...question, options: question.options.filter((_, i) => i !== index) })
  }

  return (
    <div className="group rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div className="mt-2 cursor-grab text-muted-foreground/50">
          <IconGripVertical size={18} />
        </div>

        <div className="flex-1 space-y-3">
          {/* Top row: order number + type selector */}
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {question.order + 1}
            </span>
            <select
              value={question.type}
              onChange={(e) => {
                const newType = e.target.value
                onChange({
                  ...question,
                  type: newType,
                  options: hasOptions(newType) && question.options.length === 0
                    ? ['Option 1', 'Option 2']
                    : question.options,
                })
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor={`required-${question.id}`}>
                Required
              </Label>
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(checked) => onChange({ ...question, required: checked })}
              />
            </div>
          </div>

          {/* Title */}
          <Input
            placeholder="Question title"
            className="h-9 text-base font-medium focus-visible:ring-primary/20"
            value={question.title}
            onChange={(e) => onChange({ ...question, title: e.target.value })}
          />

          {/* Description */}
          <Input
            placeholder="Description (optional)"
            className="h-8 text-sm text-muted-foreground focus-visible:ring-primary/20"
            value={question.description}
            onChange={(e) => onChange({ ...question, description: e.target.value })}
          />

          {/* Options for choice-based questions */}
          {hasOptions(question.type) && (
            <div className="space-y-2 pl-2">
              {question.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="h-8 text-sm focus-visible:ring-primary/20"
                    placeholder={`Option ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeOption(idx)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove option ${idx + 1}`}
                    title={`Remove option ${idx + 1}`}
                  >
                    <IconX size={14} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="text-xs text-primary"
              >
                <IconPlus size={14} />
                Add Option
              </Button>
            </div>
          )}
        </div>

        {/* Delete button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
          aria-label="Delete question"
          title="Delete question"
        >
          <IconTrash size={16} />
        </Button>
      </div>
    </div>
  )
}
