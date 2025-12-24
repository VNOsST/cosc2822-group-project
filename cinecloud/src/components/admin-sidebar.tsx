import { Link, useLocation } from '@tanstack/react-router'
import {
  Calendar,
  DoorOpen,
  Film,
  LayoutDashboard,
  MessageSquare,
  Ticket,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Rooms',
    href: '/rooms',
    icon: DoorOpen,
  },
  {
    title: 'Movies',
    href: '/movies',
    icon: Film,
  },
  {
    title: 'Showtimes',
    href: '/showtimes',
    icon: Calendar,
  },
  {
    title: 'Bookings',
    href: '/bookings',
    icon: Ticket,
  },
  {
    title: 'Reviews',
    href: '/reviews',
    icon: MessageSquare,
  },
]

export function AdminSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">CineCloud</span>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
