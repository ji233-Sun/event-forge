'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  IconBolt,
  IconLayoutDashboard,
  IconList,
  IconPlus,
  IconLogout,
  IconUser,
  IconChevronUp,
  IconPresentation,
} from '@tabler/icons-react'
import { authClient } from '@/lib/auth-client'

type User = {
  id: string
  name: string
  email: string
  image?: string | null
}

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      await authClient.signOut()
    } catch {
      // Sign-out failed — redirect to login regardless
    }
    router.replace('/login')
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconBolt size={18} />
                </div>
                <span className="font-bold text-base">EventForge</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                  <Link href="/dashboard">
                    <IconLayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === '/surveys' ||
                    (pathname.startsWith('/surveys/') && pathname !== '/surveys/new')
                  }
                >
                  <Link href="/surveys">
                    <IconList size={18} />
                    <span>My Surveys</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/surveys/new'}>
                  <Link href="/surveys/new">
                    <IconPlus size={18} />
                    <span>Create Survey</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/slides'}
                >
                  <Link href="/slides">
                    <IconPresentation size={18} />
                    <span>Slide Studio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <IconChevronUp size={16} className="ml-auto text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <IconUser size={16} />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <IconLogout size={16} />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
