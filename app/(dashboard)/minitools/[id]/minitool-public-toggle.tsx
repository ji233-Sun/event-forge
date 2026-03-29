'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toggleMinitoolPublic } from '../actions'

export function MinitoolPublicToggle({
  minitoolId,
  initialIsPublic,
}: {
  minitoolId: string
  initialIsPublic: boolean
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [, startTransition] = useTransition()

  function handleChange(value: boolean) {
    setIsPublic(value)
    startTransition(() => toggleMinitoolPublic(minitoolId, value))
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={isPublic} onCheckedChange={handleChange} id="public-toggle" />
      <Label htmlFor="public-toggle" className="text-xs cursor-pointer">
        {isPublic ? 'Public' : 'Private'}
      </Label>
    </div>
  )
}
