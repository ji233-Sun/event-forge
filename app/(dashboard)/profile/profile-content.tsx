'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { AvatarUpload } from '@/components/avatar-upload'
import { CountUp } from '@/components/count-up'
import { ResponseTrendChart } from '@/components/charts/response-trend-chart'
import { SurveyStatusChart } from '@/components/charts/survey-status-chart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader2,
  IconLock,
  IconClipboardList,
  IconUsers,
  IconChartBar,
  IconActivity,
  IconCalendar,
  IconMail,
  IconEdit,
  IconDeviceFloppy,
} from '@tabler/icons-react'
import { StatusBadge } from '@/components/status-badge'
import type { ProfileData } from './actions'

type User = {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: Date
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

export function ProfileContent({ user, data }: { user: User; data: ProfileData }) {
  const router = useRouter()
  const safeStats = data?.stats ?? {
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0,
    publishedRate: 0,
  }
  const safeStatusBreakdown = data?.statusBreakdown ?? {
    draft: 0,
    published: 0,
    closed: 0,
    other: 0,
  }
  const safeResponseTrend = Array.isArray(data?.responseTrend) ? data.responseTrend : []
  const safeRecentSurveys = Array.isArray(data?.recentSurveys) ? data.recentSurveys : []
  const [name, setName] = useState(user.name)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [editing, setEditing] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.createdAt))

  async function handleAvatarChange(dataUrl: string) {
    setProfileError('')
    const { error } = await authClient.updateUser({ image: dataUrl })
    if (error) {
      setProfileError(error.message ?? 'Failed to update avatar')
      return
    }
    router.refresh()
  }

  async function handleSaveProfile() {
    setProfileError('')
    setProfileSuccess('')
    setSavingProfile(true)
    const { error } = await authClient.updateUser({ name })
    setSavingProfile(false)
    if (error) {
      setProfileError(error.message ?? 'Failed to update profile')
      return
    }
    setProfileSuccess('Profile updated successfully')
    setEditing(false)
    router.refresh()
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    const { error } = await authClient.changePassword({ currentPassword, newPassword })
    setSavingPassword(false)
    if (error) {
      setPasswordError(error.message ?? 'Failed to change password')
      return
    }
    setPasswordSuccess('Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="p-6 md:p-8">
      <motion.div
        className="mx-auto max-w-5xl space-y-6"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Hero Card */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
          <Card className="overflow-hidden border-border/50">
            <div className="h-28 bg-gradient-to-r from-primary/80 to-primary/40" />
            <CardContent className="relative px-6 pb-6">
              <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <AvatarUpload
                  image={user.image}
                  name={user.name}
                  onImageChange={handleAvatarChange}
                />
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Hi, I&apos;m {user.name}
                    </h1>
                    <Badge variant="secondary" className="text-xs">Member</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconMail size={14} />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconCalendar size={14} />
                      Joined {memberSince}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editing) {
                      handleSaveProfile()
                    } else {
                      setEditing(true)
                    }
                  }}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <><IconLoader2 size={14} className="animate-spin" />Saving...</>
                  ) : editing ? (
                    <><IconDeviceFloppy size={14} />Save</>
                  ) : (
                    <><IconEdit size={14} />Edit Profile</>
                  )}
                </Button>
              </div>

              {editing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  {profileError && (
                    <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                      {profileSuccess}
                    </div>
                  )}
                  <div className="max-w-sm space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-name" className="text-sm font-medium">Display Name</Label>
                      <Input
                        id="edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 focus-visible:ring-primary/20"
                        autoFocus
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              icon={<IconClipboardList size={18} />}
              label="Surveys Created"
              value={safeStats.totalSurveys}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              icon={<IconUsers size={18} />}
              label="Total Responses"
              value={safeStats.totalResponses}
              color="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              icon={<IconChartBar size={18} />}
              label="Active Surveys"
              value={safeStats.activeSurveys}
              color="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={<IconActivity size={18} />}
              label="Active Rate"
              value={safeStats.publishedRate}
              suffix="%"
              color="bg-rose-50 text-rose-600"
            />
          </div>
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Response Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponseTrendChart data={safeResponseTrend} />
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Survey Status</CardTitle>
              </CardHeader>
              <CardContent>
                <SurveyStatusChart data={safeStatusBreakdown} />
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Bottom Row */}
        <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Change Password */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconLock size={18} className="text-primary" />
                  <CardTitle className="text-base">Change Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  {passwordError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                      {passwordSuccess}
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-10 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-10 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-10 focus-visible:ring-primary/20"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={savingPassword}>
                    {savingPassword ? (
                      <><IconLoader2 size={16} className="animate-spin" />Updating...</>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {safeRecentSurveys.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No surveys yet</p>
                ) : (
                  <div className="space-y-3">
                    {safeRecentSurveys.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {s.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(s.createdAt))}
                            {' · '}{s.responseCount} response{s.responseCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <StatusBadge status={s.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix = '',
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  color: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${color}`}>
          {icon}
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">
          <CountUp end={value} suffix={suffix} />
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

