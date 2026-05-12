import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { ProfileDialog } from '@/components/profile-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UserNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <Button size="sm" onClick={() => navigate('/login')}>
        Iniciar sesión
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="topbar-icon-button relative h-10 w-10 rounded-full p-0 hover:translate-y-0"
              aria-label="Abrir menú de perfil"
            />
          }
        >
            <div className="topbar-avatar">
              {String(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col gap-y-1 leading-none">
              <p className="font-medium">{user.name || 'Usuario'}</p>
              <p className="w-[200px] truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
