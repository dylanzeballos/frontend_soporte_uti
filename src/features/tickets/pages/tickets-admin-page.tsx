import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilLine, RadioIcon, ShieldCheck, Ticket as TicketIcon } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useRealtime } from '@/lib/realtime/context';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketForm, type TicketSelectOption } from '@/features/tickets/components';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type Ticket,
  type TicketFormValues,
  type TicketPriority,
  type TicketStatus,
} from '@/features/tickets/schemas/ticket.schema';
import { isAgent, type User } from '@/features/users/schemas';
import { useServices, useTickets, useUsers } from '@/hooks/useApi';

type TicketFilterState = {
  search: string;
  status: 'all' | TicketStatus;
  priority: 'all' | TicketPriority;
};

type ApiLikeUser = User & {
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: {
    name?: string;
  };
};

function getUserDisplayName(user: ApiLikeUser): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

function buildUserOptions(users: User[]): TicketSelectOption[] {
  return users.map((user) => {
    const apiUser = user as ApiLikeUser;
    return {
      value: user.id,
      label: getUserDisplayName(apiUser),
      description: apiUser.role?.name || user.email,
    };
  });
}

function toFormValues(ticket: Ticket): TicketFormValues {
  return {
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    assignedToId: ticket.assignedToId ?? null,
    emitterId: ticket.emitterId ?? null,
    serviceId: ticket.serviceId ?? null,
    slaMinutes: ticket.slaMinutes ?? null,
  };
}

export function TicketsAdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { list, update } = useTickets();
  const { status: wsStatus, notifications } = useRealtime();
  const lastUpdateCount = notifications.filter(
    (n) => n.type === 'ticket.created' || n.type === 'ticket.status_changed' || n.type === 'ticket.assigned'
  ).length;
  const { list: listUsers } = useUsers();
  const { list: listServices } = useServices();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!isAgent(user)) {
    return <Navigate to="/tickets" replace />;
  }

  const scope = searchParams.get('scope') === 'mine' ? 'mine' : 'all';
  const isMyRequestsView = scope === 'mine';

  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState<TicketFilterState>({
    search: '',
    status: 'all',
    priority: 'all',
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', user?.id, scope],
    queryFn: async () =>
      list({
        createdById: isMyRequestsView ? user?.id : undefined,
        excludeCreatedById: isMyRequestsView ? undefined : user?.id,
        limit: 100,
      }),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['ticket-form-users'],
    queryFn: listUsers,
  });

  const { data: serviceOptions = [] } = useQuery<TicketSelectOption[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const services = await listServices();
      return services.map((service) => ({
        value: service.id,
        label: service.name,
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TicketFormValues }) => update(id, data),
    onSuccess: () => {
      toast.success('Ticket actualizado correctamente');
      setShowForm(false);
      setSelectedTicket(null);
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const userOptions = buildUserOptions(users);
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      filters.search.trim().length === 0 ||
      ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
    const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleEditClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setSelectedTicket(null);
    setShowForm(false);
  };

  const handleSubmit = async (values: TicketFormValues) => {
    if (selectedTicket) {
      await updateMutation.mutateAsync({ id: selectedTicket.id, data: values });
    }
  };

  return (
    <div className="space-y-6">
      <section className="lively-hero rounded-(--radius-panel) px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="editorial-kicker">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isMyRequestsView ? 'Solicitudes propias' : 'Gestion administrativa'}
            </div>
            <h1 className="mt-5 text-[clamp(1.9rem,2.9vw,2.9rem)] font-bold tracking-[-0.02em] text-foreground">
              {isMyRequestsView ? 'Mis solicitudes' : 'Gestionar tickets'}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant={isMyRequestsView ? 'outline' : 'default'}
                onClick={() => setSearchParams({})}
              >
                Todas las solicitudes
              </Button>
              <Button
                variant={isMyRequestsView ? 'default' : 'outline'}
                onClick={() => setSearchParams({ scope: 'mine' })}
              >
                Mis solicitudes
              </Button>
            </div>
          </div>
          {wsStatus === 'connected' && (
            <div
              className="mt-1 flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success"
              title={`Tiempo real activo · ${lastUpdateCount} evento${lastUpdateCount !== 1 ? 's' : ''} recibido${lastUpdateCount !== 1 ? 's' : ''}`}
            >
              <RadioIcon className="h-3 w-3 animate-pulse" aria-hidden="true" />
              En vivo
            </div>
          )}
        </div>
      </section>

      {showForm ? (
        <TicketForm
          variant="admin"
          mode="edit"
          initialValues={selectedTicket ? toFormValues(selectedTicket) : undefined}
          assigneeOptions={userOptions}
          emitterOptions={userOptions}
          serviceOptions={serviceOptions}
          isSubmitting={updateMutation.isPending}
          submitLabel="Guardar ticket"
          className="rounded-(--radius-panel)"
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
        />
      ) : null}

      <Card className="ticket-list-shell rounded-(--radius-panel)">
        <CardHeader className="px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          <div className="space-y-2">
            <CardTitle>{isMyRequestsView ? 'Solicitudes creadas por ti' : 'Solicitudes recibidas'}</CardTitle>
            <CardDescription>
              {isMyRequestsView
                ? 'Aqui ves solo los tickets registrados desde tu cuenta.'
                : 'Edita cualquier ticket desde aqui.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.4fr_0.4fr]">
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Buscar por titulo o descripcion"
            />

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((current) => ({ ...current, status: value as TicketFilterState['status'] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado">
                  {filters.status === 'all' ? 'Todos los estados' : getStatusLabel(filters.status)}
                </SelectValue>
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

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters((current) => ({ ...current, priority: value as TicketFilterState['priority'] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridad">
                  {filters.priority === 'all' ? 'Todas las prioridades' : getPriorityLabel(filters.priority)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ticketsLoading ? (
            <div className="editorial-inset rounded-md py-14 text-center text-muted-foreground">Cargando tickets...</div>
          ) : filteredTickets.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTickets.map((ticket) => {
                const assignee = ticket.assignedTo ? getUserDisplayName(ticket.assignedTo as ApiLikeUser) : 'Sin asignar';
                const emitter = ticket.emitter ? getUserDisplayName(ticket.emitter as ApiLikeUser) : 'No definido';

                return (
                  <Card key={ticket.id} className="ticket-record-card rounded-(--radius-panel)">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <CardDescription className="line-clamp-2 leading-6">{ticket.description}</CardDescription>
                        </div>

                        <Button variant="ghost" size="icon-sm" aria-label={`Editar ticket ${ticket.id}`} onClick={() => handleEditClick(ticket)}>
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-3 px-5 pb-5 pt-4 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Asignado</div>
                          <div className="mt-1 font-medium text-foreground">{assignee}</div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Emisor</div>
                          <div className="mt-1 font-medium text-foreground">{emitter}</div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Servicio</div>
                          <div className="mt-1 font-medium text-foreground">{ticket.service?.name ?? 'No definido'}</div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">SLA</div>
                          <div className="mt-1 font-medium text-foreground">{ticket.slaMinutes ? `${ticket.slaMinutes} min` : 'Sin SLA'}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                          <TicketIcon className="mr-1 inline h-3.5 w-3.5" />
                          #{ticket.id}
                        </span>
                        <span>Actualizado {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">No hay tickets para mostrar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
