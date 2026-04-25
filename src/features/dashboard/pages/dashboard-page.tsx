import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-context';
import { useTickets } from '@/hooks/useApi';
import { Clock, CheckCircle, AlertCircle, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Ticket as TicketType } from '@/features/tickets/schemas/ticket.schema';
import type { User } from '@/features/users/schemas';

type DashboardUser = User & {
  firstName?: string;
  lastName?: string;
  role?: unknown;
};

function getDashboardUserName(user: DashboardUser | null) {
  if (!user) return 'Usuario';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

function getDashboardUserRole(user: DashboardUser | null) {
  if (!user) return 'Sin rol';
  const roleValue = user.role as string | { name?: string } | undefined;
  if (typeof roleValue === 'string') {
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      agent: 'Agente',
      user: 'Usuario',
    };
    return roleLabels[roleValue] ?? roleValue;
  }
  if (roleValue && typeof roleValue === 'object') {
    const roleName = roleValue.name;
    return typeof roleName === 'string' ? roleName : 'Sin rol';
  }
  return 'Sin rol';
}

export function DashboardPage() {
  const { user } = useAuth();
  const dashboardUser = user as DashboardUser | null;
  const { list } = useTickets();

  const { data: tickets = [] } = useQuery<TicketType[]>({
    queryKey: ['tickets'],
    queryFn: list,
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t: TicketType) => t.status === 'open').length,
    inProgress: tickets.filter((t: TicketType) => t.status === 'in_progress').length,
    resolved: tickets.filter((t: TicketType) => t.status === 'resolved').length,
  };

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Clock,
      iconClass: 'text-accent-foreground',
      bgClass: 'bg-accent/70',
    },
    {
      title: 'Abiertos',
      value: stats.open,
      icon: AlertCircle,
      iconClass: 'text-danger',
      bgClass: 'bg-danger/10',
    },
    {
      title: 'En Progreso',
      value: stats.inProgress,
      icon: Clock,
      iconClass: 'text-warning',
      bgClass: 'bg-warning/10',
    },
    {
      title: 'Resueltos',
      value: stats.resolved,
      icon: CheckCircle,
      iconClass: 'text-success',
      bgClass: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
        <div className="editorial-kicker">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </div>
        <h1 className="mt-5 text-[clamp(1.8rem,2.9vw,2.8rem)] font-bold tracking-[-0.02em] text-foreground">
          Bienvenido, {getDashboardUserName(dashboardUser)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {getDashboardUserRole(dashboardUser)} · {String(dashboardUser?.email ?? '')}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="rounded-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`rounded-md p-1.5 ${stat.bgClass}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconClass}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base">Tickets Recientes</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.slice(0, 5).map((ticket: TicketType) => (
                  <div
                    key={ticket.id}
                    className="editorial-inset flex items-center justify-between rounded-md px-3 py-2.5"
                  >
                    <span className="truncate text-sm font-medium text-foreground">{ticket.title}</span>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay tickets recientes</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base">Información de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6 pb-6">
            <div className="editorial-inset flex justify-between rounded-md px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Rol</span>
              <span className="font-medium text-foreground capitalize">
                {getDashboardUserRole(dashboardUser)}
              </span>
            </div>
            <div className="editorial-inset flex justify-between rounded-md px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{String(dashboardUser?.email ?? '')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
