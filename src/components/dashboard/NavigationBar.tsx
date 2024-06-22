import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  User
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip'; // Adjust this path based on your project structure

const Navbar: React.FC = () => {
    return (
        <TooltipProvider>
          <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-gray-900 text-white sm:flex">
            <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Profile</TooltipContent>
              </Tooltip>
            </nav>
          </aside>
        </TooltipProvider>
    );
}

export default Navbar;
