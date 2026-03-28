import { IconEye, IconEyeOff } from '@tabler/icons-react'

type PasswordToggleProps = {
  show: boolean
  onToggle: () => void
  disabled?: boolean
}

export function PasswordToggle({
  show,
  onToggle,
  disabled = false,
}: PasswordToggleProps) {
  return (
    <button
      type="button"
      aria-label={show ? '隐藏密码' : '显示密码'}
      disabled={disabled}
      onClick={onToggle}
      className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground group-focus-within:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
    </button>
  )
}
