import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  SquareKanban,
  Ticket,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type Ticket as TicketItem,
} from '@/features/tickets/schemas/ticket.schema';
import { getDefaultRouteForUser, isAgent } from '@/features/users/schemas';
import { useTickets } from '@/hooks/useApi';

function getUserDisplayName(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isActiveStatus(status: TicketItem['status']) {
  return status === 'open' || status === 'in_progress';
}

export function TechnicianDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { list } = useTickets();

  if (!user) return null;
  if (!isAgent(user)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<TicketItem[]>({
    queryKey: ['technician-dashboard', 'assignments', user.id],
    enabled: Boolean(user.id),
    queryFn: async () => list({ assignedToId: user.id, limit: 100 }),
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<TicketItem[]>({
    queryKey: ['technician-dashboard', 'reports', user.id],
    enabled: Boolean(user.id),
    queryFn: async () => list({ createdById: user.id, limit: 100 }),
  });

  const { data: availableTickets = [], isLoading: pendingLoading } = useQuery<TicketItem[]>({
    queryKey: ['technician-dashboard', 'pending', user.id],
    enabled: Boolean(user.id),
    queryFn: async () => list({ limit: 100, unassigned: true }),
  });

  const loading = assignmentsLoading || reportsLoading || pendingLoading;
  const urgentAssignments = assignments.filter((ticket) => ticket.priority === 'urgent').length;
  const activeAssignments = assignments.filter((ticket) => isActiveStatus(ticket.status)).length;
  const openReports = reports.filter((ticket) => isActiveStatus(ticket.status)).length;
  const pendingTickets = availableTickets;

  const cards = [
    {
      title: 'Asignaciones',
      value: assignments.length,
      description: 'Tickets que hoy estan a tu cargo.',
      icon: ClipboardList,
    },
    {
      title: 'En curso',
      value: activeAssignments,
      description: 'Pendientes o en progreso.',
      icon: Clock3,
    },
    {
      title: 'Urgentes',
      value: urgentAssignments,
      description: 'Necesitan atencion prioritaria.',
      icon: AlertTriangle,
    },
    {
      title: 'Tus reportes activos',
      value: openReports,
      description: 'Reportes creados por ti aun abiertos.',
      icon: CheckCircle2,
    },
    {
      title: 'Pendientes libres',
      value: pendingTickets.length,
      description: 'Tickets aun sin responsable.',
      icon: Inbox,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="editorial-kicker">Vista tecnica</div>
            <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
              Hola, {getUserDisplayName(user)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Aqui tienes un resumen rapido de tus tickets asignados, tus reportes y el flujo de trabajo del dia.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/technician/assignments')} className="min-w-48 justify-center">
              <Ticket className="mr-2 h-4 w-4" />
              Ver asignaciones
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/technician/pending')}
              className="min-w-48 justify-center"
            >
              <Inbox className="mr-2 h-4 w-4" />
              Ver pendientes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/technician/kanban')}
              className="min-w-48 justify-center"
            >
              <SquareKanban className="mr-2 h-4 w-4" />
              Abrir Kanban
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title} className="rounded-[var(--radius-panel)]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>{card.title}</CardDescription>
                  <CardTitle className="mt-2 text-3xl">{card.value}</CardTitle>
                </div>
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {card.description}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Asignaciones recientes</CardTitle>
            <CardDescription>Lo ultimo que quedo bajo tu responsabilidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando resumen...</p>
            ) : assignments.length > 0 ? (
              assignments.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">#{ticket.id} · {ticket.service?.name ?? 'Sin servicio'}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(ticket.updatedAt)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tienes tickets asignados por ahora.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Tickets pendientes</CardTitle>
            <CardDescription>Lo que aun esta libre para que puedas tomarlo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando pendientes...</p>
            ) : pendingTickets.length > 0 ? (
              pendingTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">#{ticket.id} · Sin asignar</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay tickets pendientes sin responsable.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Tus reportes</CardTitle>
            <CardDescription>Tickets que abriste y que puedes seguir de cerca.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando reportes...</p>
            ) : reports.length > 0 ? (
              reports.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.assignedTo?.name || ticket.assignedTo?.email || 'Sin responsable'}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Todavia no registraste reportes desde tu cuenta.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
