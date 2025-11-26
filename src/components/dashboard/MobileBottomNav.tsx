import { NavLink } from 'react-router-dom';
import { MapPin, Bell, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

export const MobileBottomNav = () => {
  const { planType } = useSubscription();
  
  const baseNavItems = [
    { to: '/dashboard/destinations', icon: MapPin, label: 'Destinations' },
    { to: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = planType === 'annual'
    ? [
        ...baseNavItems.slice(0, 2),
        { to: '/dashboard/guarantee', icon: Shield, label: 'Guarantee' },
        baseNavItems[2],
      ]
    : baseNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-lg z-40 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1',
                'min-w-[44px] min-h-[44px] rounded-lg transition-all duration-200',
                'relative group',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:scale-95'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full animate-fade-in" />
                )}
                <item.icon 
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-active:scale-90'
                  )} 
                />
                <span className={cn(
                  'text-xs font-medium transition-all duration-200',
                  isActive ? 'font-semibold' : ''
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
