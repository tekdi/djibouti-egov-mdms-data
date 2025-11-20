import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth';
import { User, LogOut } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-white hover:bg-slate-800">
          <User className="mr-2 h-4 w-4" />
          {user.name || user.userName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || user.userName}</p>
            <p className="text-xs text-muted-foreground">{user.emailId}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <p className="text-xs text-muted-foreground mb-1">Roles:</p>
          <div className="flex flex-wrap gap-1">
            {user.roles?.map((role, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {role.name}
              </Badge>
            ))}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 