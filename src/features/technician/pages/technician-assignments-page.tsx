import { useMemo, useState } from 'react';
import { ClipboardCheck, Inbox, Search, SquareKanban } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type Ticket,
  type TicketStatus,
} from '@/features/tickets/schemas/ticket.schema';
import { getDefaultRouteForUser, isAgent } from '@/features/users/schemas';
import { useFilteredTicketsQuery } from '@/features/tickets/hooks';

type StatusFilter = 'all' | TicketStatus;

function getDisplayName(ticket: Ticket) {
  return ticket.emitter?.name || ticket.emitter?.email || ticket.createdBy?.name || ticket.createdBy?.email || 'Sin emisor';
}

export function TechnicianAssignmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const isTechnician = !!user && isAgent(user);
  const { data: ticketsResponse, isLoading } = useFilteredTicketsQuery({
    assignedToId: user?.id ?? 0,
    limit: 100,
    enabled: isTechnician,
  });
  const assignments = ticketsResponse?.data ?? [];

  const filteredAssignments = useMemo(() => {
    return assignments.filter((ticket) => {
      const matchesStatus = status === 'all' || ticket.status === status;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        ticket.title.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term) ||
        String(ticket.id).includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [assignments, search, status]);

  if (!user) return null;
  if (!isTechnician) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="editorial-kicker">Operacion tecnica</div>
            <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
              Mis asignaciones
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Consulta todo lo que esta asignado a tu cuenta y usa el tablero Kanban para mover estados con rapidez.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Filtro de trabajo</CardTitle>
          <CardDescription>Encuentra rapido cualquier ticket que te pertenezca.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1.3fr_0.5fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, descripcion o ID"
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
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
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Tickets asignados</CardTitle>
          <CardDescription>{filteredAssignments.length} ticket(s) coinciden con tu filtro actual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando asignaciones...</p>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredAssignments.map((ticket) => (
                <Card key={ticket.id} className="ticket-record-card rounded-[var(--radius-panel)]">
                  <CardHeader className="px-5 pb-0 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                        </div>
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription className="line-clamp-2 leading-6">
                          {ticket.description}
                        </CardDescription>
                      </div>

                      <div className="ticket-entry-icon h-11 w-11 shrink-0 rounded-full">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-3 px-5 pb-5 pt-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Servicio</div>
                        <div className="mt-1 font-medium text-foreground">
                          {ticket.service?.name ?? 'Sin servicio'}
                        </div>
                      </div>
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Reportado por</div>
                        <div className="mt-1 font-medium text-foreground">{getDisplayName(ticket)}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>#{ticket.id}</span>
                      <span>Actualizado {new Date(ticket.updatedAt).toLocaleDateString('es-BO')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">No tienes asignaciones en este filtro</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Prueba otro estado o revisa tu tablero Kanban.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
