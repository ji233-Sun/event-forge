import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

type AlertProps = {
  message: string
}

export function ErrorAlert({ message }: AlertProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in zoom-in-95 duration-200"
    >
      <IconAlertCircle size={18} className="shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  )
}

export function InfoAlert({ message }: AlertProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 animate-in fade-in zoom-in-95 duration-200 dark:text-green-400"
    >
      <IconCircleCheck size={18} className="shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  )
}
