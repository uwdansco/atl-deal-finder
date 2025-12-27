import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const MobileMenu = () => {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { to: '/destinations', label: 'Destinations' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/blog', label: 'Blog' },
    { to: '/about', label: 'About' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-w-[44px] min-h-[44px]"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[280px] sm:w-[350px]">
        <div className="flex items-center gap-2 mb-8">
          <Plane className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Memphis Flights</span>
        </div>
        
        <nav className="flex flex-col gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="text-lg font-medium py-2 hover:text-primary transition-colors min-h-[44px] flex items-center"
            >
              {item.label}
            </Link>
          ))}
          
          <div className="border-t border-border my-4" />
          
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-lg font-medium py-2 hover:text-primary transition-colors min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
          
          <Link to="/signup" onClick={() => setOpen(false)}>
            <Button className="w-full min-h-[44px]">
              Get Started Free
            </Button>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
