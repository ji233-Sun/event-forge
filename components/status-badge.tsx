const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  published: {
    label: 'Published',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-red-50 text-red-700 border-red-200',
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
