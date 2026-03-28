const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-[var(--status-draft-bg)] text-[var(--status-draft-fg)] border-[var(--status-draft-border)]',
  },
  published: {
    label: 'Published',
    className: 'bg-[var(--status-published-bg)] text-[var(--status-published-fg)] border-[var(--status-published-border)]',
  },
  closed: {
    label: 'Closed',
    className: 'bg-[var(--status-closed-bg)] text-[var(--status-closed-fg)] border-[var(--status-closed-border)]',
  },
}

const fallbackConfig = { label: '', className: 'bg-muted text-muted-foreground border-border' }

export function StatusBadge({
  status,
  size = 'default',
}: {
  status: string
  size?: 'default' | 'sm'
}) {
  const config = statusConfig[status] ?? { ...fallbackConfig, label: status }
  const sizeClasses =
    size === 'sm'
      ? 'gap-1 px-2 py-0.5 text-[10px]'
      : 'gap-1.5 px-2 py-0.5 text-[11px]'
  const dotSize = size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5'

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${sizeClasses} ${config.className}`}>
      <span className={`${dotSize} rounded-full bg-current`} />
      {config.label}
    </span>
  )
}
