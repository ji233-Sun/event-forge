'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSurvey } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { IconLoader2 } from '@tabler/icons-react'
import Link from 'next/link'

export default function NewSurveyPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setError('')
    setLoading(true)

    try {
      const { id } = await createSurvey(title.trim(), description.trim())
      router.push(`/surveys/${id}/edit`)
    } catch {
      setError('Failed to create survey. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">Create New Survey</CardTitle>
            <CardDescription>
              Start by giving your survey a name. You can add questions in the next step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Survey Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Event Feedback Survey"
                  className="h-11 focus-visible:ring-primary/20"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what this survey is about..."
                  className="min-h-[100px] focus-visible:ring-primary/20"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" asChild>
                  <Link href="/surveys">Cancel</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <><IconLoader2 size={18} className="animate-spin" />Creating...</>
                  ) : (
                    'Create & Add Questions'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
