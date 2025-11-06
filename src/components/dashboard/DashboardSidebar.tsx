import { NavLink, useLocation } from 'react-router-dom';
import { Plane, MapPin, Bell, Settings, Shield } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const baseItems = [
  { title: 'My Destinations', url: '/dashboard/destinations', icon: MapPin },
  { title: 'Price Alerts', url: '/dashboard/alerts', icon: Bell },
  { title: 'Account Settings', url: '/dashboard/settings', icon: Settings },
];

export const DashboardSidebar = () => {
  const { open } = useSidebar();
  const location = useLocation();
  const { planType } = useSubscription();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/50';

  // Add Booking Guarantee link for annual subscribers
  const items = planType === 'annual' 
    ? [...baseItems, { title: 'Booking Guarantee', url: '/dashboard/guarantee', icon: Shield }]
    : baseItems;

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'}>
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <Plane className="h-6 w-6 text-primary" />
          {open && <span className="font-bold text-lg">Flight Tracker</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
