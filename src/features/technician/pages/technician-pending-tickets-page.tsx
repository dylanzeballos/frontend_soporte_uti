import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox, Loader2, Search, UserPlus2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  invalidateTicketCaches,
  syncUpdatedTicketCaches,
} from '@/features/tickets/lib/ticket-cache';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '@/features/tickets/schemas/ticket.schema';
import { getDefaultRouteForUser, isAgent } from '@/features/users/schemas';
import { useFilteredTicketsQuery, useAssignTicketMutation } from '@/features/tickets/hooks';

type StatusFilter = 'all' | TicketStatus;
type PriorityFilter = 'all' | TicketPriority;

const priorityOrder: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getEmitterName(ticket: Ticket) {
  return ticket.emitter?.name || ticket.emitter?.email || ticket.createdBy?.name || ticket.createdBy?.email || 'Sin emisor';
}

export function TechnicianPendingTicketsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const assignMutation = useAssignTicketMutation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const isTechnician = !!user && isAgent(user);
  const { data: ticketsResponse, isLoading } = useFilteredTicketsQuery({
    limit: 100,
    unassigned: true,
    enabled: isTechnician,
  });
  const tickets = ticketsResponse?.data ?? [];

  const pendingTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const matchesStatus = status === 'all' || ticket.status === status;
        const matchesPriority = priority === 'all' || ticket.priority === priority;
        const term = search.trim().toLowerCase();
        const matchesSearch =
          term.length === 0 ||
          ticket.title.toLowerCase().includes(term) ||
          ticket.description.toLowerCase().includes(term) ||
          String(ticket.id).includes(term);

        return matchesStatus && matchesPriority && matchesSearch;
      })
      .sort((left, right) => {
        const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [tickets, priority, search, status]);

  if (!user) return null;
  if (!isTechnician) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  const handleAssign = async (ticketId: number) => {
    const updatedTicket = await assignMutation.mutateAsync({ id: ticketId, data: { assignedToId: user.id } });

    toast.success('El ticket ya quedo asignado a tu cuenta');
    syncUpdatedTicketCaches(queryClient, updatedTicket);
    invalidateTicketCaches(queryClient);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="editorial-kicker">Bandeja abierta</div>
            <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
              Tickets pendientes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Aqui ves los tickets que todavia no tienen responsable. Si el admin aun no lo asigno, puedes tomarlo desde esta vista.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/technician/assignments')}
              className="min-w-48 justify-center"
            >
              Ver mis asignaciones
            </Button>
          </div>
        </div>
      </section>

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Filtro de pendientes</CardTitle>
          <CardDescription>Busca tickets libres por titulo, estado, prioridad o identificador.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_0.5fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, descripcion o ID"
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(value) => setStatus((value as StatusFilter) ?? 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="open">Abierto</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="resolved">Resuelto</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(value) => setPriority((value as PriorityFilter) ?? 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Tickets disponibles</CardTitle>
          <CardDescription>{pendingTickets.length} ticket(s) sin asignacion encontrados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando tickets pendientes...</p>
          ) : pendingTickets.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {pendingTickets.map((ticket) => {
                const isAssigningThisTicket =
                  assignMutation.isPending && assignMutation.variables?.id === ticket.id;

                return (
                  <Card key={ticket.id} className="ticket-record-card rounded-[var(--radius-panel)]">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                            <Badge variant="outline">Sin asignar</Badge>
                          </div>
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <CardDescription className="line-clamp-2 leading-6">
                            {ticket.description}
                          </CardDescription>
                        </div>

                        <div className="ticket-entry-icon h-11 w-11 shrink-0 rounded-full">
                          <Inbox className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-4 px-5 pb-5 pt-4 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Servicio</div>
                          <div className="mt-1 font-medium text-foreground">
                            {ticket.service?.name ?? 'Sin servicio'}
                          </div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Reportado por</div>
                          <div className="mt-1 font-medium text-foreground">{getEmitterName(ticket)}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>#{ticket.id}</span>
                        <span>Creado {new Date(ticket.createdAt).toLocaleDateString('es-BO')}</span>
                      </div>

                      <Button
                        type="button"
                        className="min-w-44 justify-center"
                        disabled={assignMutation.isPending}
                        onClick={() => handleAssign(ticket.id)}
                      >
                        {isAssigningThisTicket ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Asignandome...
                          </>
                        ) : (
                          <>
                            <UserPlus2 className="mr-2 h-4 w-4" />
                            Asignarme este ticket
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">No hay tickets pendientes disponibles</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cuando aparezcan tickets sin responsable podras tomarlos desde aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
