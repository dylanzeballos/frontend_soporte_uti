import { useAuth } from '@/components/auth-context';
import { ModeToggle } from '@/components/mode-toggle';
import { getAppUserRole, type AppUserRole } from '@/features/users/schemas';
import { UserNav } from './user-nav';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', roles: ['admin', 'agent', 'user'] as AppUserRole[] },
  { label: 'Tickets', href: '/tickets', roles: ['admin', 'agent', 'user'] as AppUserRole[] },
  { label: 'Usuarios', href: '/admin/users', roles: ['admin'] as AppUserRole[] },
];

export function Header() {
  const { user } = useAuth();

  const filteredNav = navItems.filter(item =>
    user && item.roles.includes(getAppUserRole(user))
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <img src="/LogoFCE.webp" alt="UTI" className="h-8 w-auto" />
            <span className="hidden text-lg font-bold tracking-tight sm:block">Gestor Soporte UTI</span>
          </a>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {filteredNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
