import { Link, useLocation } from '@tanstack/react-router'
import {
  Bell,
  Calendar,
  DoorOpen,
  Film,
  LayoutDashboard,
  MessageSquare,
  Ticket,
  Users,
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
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Rooms',
    href: '/admin/rooms',
    icon: DoorOpen,
  },
  {
    title: 'Movies',
    href: '/admin/movies',
    icon: Film,
  },
  {
    title: 'Showtimes',
    href: '/admin/showtimes',
    icon: Calendar,
  },
  {
    title: 'Bookings',
    href: '/admin/bookings',
    icon: Ticket,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: MessageSquare,
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
  },
]

export function AdminSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 px-6 py-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500">
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
