import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-context';
import { useTickets } from '@/hooks/useApi';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Ticket as TicketType } from '@/features/tickets/schemas/ticket.schema';

export function DashboardPage() {
  const { user } = useAuth();
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
    { title: 'Total', value: stats.total, icon: Clock, color: 'text-blue-500' },
    { title: 'Abiertos', value: stats.open, icon: AlertCircle, color: 'text-red-500' },
    { title: 'En Progreso', value: stats.inProgress, icon: CheckCircle, color: 'text-yellow-500' },
    { title: 'Resueltos', value: stats.resolved, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {user?.firstName + ' ' + user?.lastName || user?.email}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tickets Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.slice(0, 5).map((ticket: TicketType) => (
                  <div key={ticket.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm truncate">{ticket.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay tickets recientes</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tu rol</span>
              <span className="font-medium capitalize">{String(user?.role?.name)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{String(user?.email)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
