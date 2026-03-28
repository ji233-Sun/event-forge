"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  disabled = false,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { disabled?: boolean }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      data-disabled={disabled ? "true" : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
