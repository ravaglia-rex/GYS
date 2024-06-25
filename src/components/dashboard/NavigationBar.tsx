import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, DollarSign } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';

const Navbar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-foreground' : 'text-muted-foreground';
    };

    return (
        <TooltipProvider>
          <aside className="fixed inset-y-0 left-0 z-10 hidden w-16 flex-col bg-gray-900 text-white sm:flex">
            <div className="flex flex-col items-center py-4">
              <img src='/argus_A_logo.png' alt="Argus Logo" className="h-12 w-12" />
            </div>
            <nav className="flex flex-col items-center gap-6 px-3 sm:py-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/dashboard"
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-foreground ${isActive('/dashboard')}`}
                  >
                    <Home className="h-6 w-6" />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/payments"
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-foreground ${isActive('/payments')}`}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span className="sr-only">Payments</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Payments</TooltipContent>
              </Tooltip>
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-6 px-3 sm:py-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/settings"
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:text-foreground ${isActive('/settings')}`}
                  >
                    <Settings className="h-6 w-6" />
                    <span className="sr-only">Settings</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            </nav>
          </aside>
        </TooltipProvider>
    );
}

export default Navbar;