import React from 'react';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuItem 
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { UserCircle2Icon, UserIcon, HelpCircleIcon, Clock } from 'lucide-react';
import SignOutButton from '../auth/SignOutButton';

const UserDropdown: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <UserCircle2Icon size={24} className="text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 text-white">
        <DropdownMenuLabel className="text-gray-400">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem className="hover:bg-gray-700 cursor-not-allowed">
          <div className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
            <Clock className="ml-auto h-4 w-4 text-yellow-500" />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-gray-700 cursor-not-allowed">
          <div className="flex items-center">
            <HelpCircleIcon className="mr-2 h-4 w-4" />
            Support
            <Clock className="ml-auto h-4 w-4 text-yellow-500" />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem className="hover:bg-gray-700">
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
