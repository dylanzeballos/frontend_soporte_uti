import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  PencilLine,
  RadioIcon,
  ShieldCheck,
  Ticket as TicketIcon,
  UserPlus2,
} from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

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
import { useUpdateTicketMutation, useAssignTicketMutation, useFilteredTicketsQuery } from '@/features/tickets/hooks';
import { useUsersQuery } from '@/features/users/hooks';
import { useServicesQuery, type ServiceItem } from '@/features/services/hooks';
import { useRealtime } from '@/lib/realtime/context';

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
  const { status: wsStatus, notifications } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [quickAssignments, setQuickAssignments] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState<TicketFilterState>({
    search: '',
    status: 'all',
    priority: 'all',
  });
  const editFormRef = useRef<HTMLDivElement | null>(null);
  const isAgentUser = isAgent(user);
  const userId = user?.id ?? 0;

  const scope = searchParams.get('scope') === 'mine' ? 'mine' : 'all';
  const isMyRequestsView = scope === 'mine';
  const lastUpdateCount = notifications.filter(
    (notification) =>
      notification.type === 'ticket.created' ||
      notification.type === 'ticket.status_changed' ||
      notification.type === 'ticket.assigned',
  ).length;

  const { data: ticketsResponse, isLoading: ticketsLoading } = useFilteredTicketsQuery({
    createdById: isMyRequestsView ? userId : undefined,
    excludeCreatedById: isMyRequestsView ? undefined : userId,
    limit: 100,
    enabled: isAgentUser,
  });
  const tickets = ticketsResponse?.data ?? [];

  const { data: usersResponse } = useUsersQuery({ limit: 100 });
  const users = usersResponse?.data ?? (Array.isArray(usersResponse) ? usersResponse : []);

  const { data: servicesResponse } = useServicesQuery({ limit: 100 });
  const serviceOptions = (servicesResponse ?? []).map((service: ServiceItem) => ({
    value: service.id,
    label: service.name,
  }));

  const updateMutation = useUpdateTicketMutation();

  const assignMutation = useAssignTicketMutation();

  const userOptions = buildUserOptions(users);
  const technicianOptions = useMemo(
    () =>
      buildUserOptions(
        users.filter((candidate) => candidate.isActive && isAgent(candidate)),
      ),
    [users],
  );

  useEffect(() => {
    if (!showForm || !selectedTicket) {
      return;
    }

    const target = editFormRef.current;
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      const firstField =
        target.querySelector<HTMLInputElement | HTMLTextAreaElement>('#ticket-title');
      firstField?.focus();
    }, 180);
  }, [selectedTicket, showForm]);

  if (!isAgentUser) {
    return <Navigate to="/tickets" replace />;
  }

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

    if (showForm) {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCloseForm = () => {
    setSelectedTicket(null);
    setShowForm(false);
  };

  const handleQuickAssign = (ticket: Ticket) => {
    const nextAssigneeId = Number(quickAssignments[ticket.id] ?? 0);
    if (!nextAssigneeId || nextAssigneeId === ticket.assignedToId) {
      return;
    }

    assignMutation.mutate({
      id: ticket.id,
      data: { assignedToId: nextAssigneeId },
    }, {
      onSuccess: () => {
        toast.success('Responsable asignado correctamente');
        setQuickAssignments((current) => {
          const next = { ...current };
          delete next[ticket.id];
          return next;
        });
      },
      onError: () => {
        toast.error('No se pudo asignar el responsable del ticket');
      }
    });
  };

  const handleSubmit = async (values: TicketFormValues) => {
    if (selectedTicket) {
      await updateMutation.mutateAsync({ id: selectedTicket.id, data: values }, {
        onSuccess: () => {
          toast.success('Ticket actualizado correctamente');
          setShowForm(false);
          setSelectedTicket(null);
        }
      });
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
        <div ref={editFormRef} className="scroll-mt-24 space-y-3">
          <div className="rounded-(--radius-panel) border border-primary/20 bg-primary/5 px-5 py-4">
            <div className="editorial-kicker">Edicion activa</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Estas editando el ticket{' '}
              <span className="font-semibold text-foreground">
                #{selectedTicket?.id} {selectedTicket?.title}
              </span>
              .
            </p>
          </div>

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
        </div>
      ) : null}

      <Card className="ticket-list-shell rounded-(--radius-panel)">
        <CardHeader className="px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          <div className="space-y-2">
            <CardTitle>
              {isMyRequestsView ? 'Solicitudes creadas por ti' : 'Solicitudes recibidas'}
            </CardTitle>
            <CardDescription>
              {isMyRequestsView
                ? 'Aqui ves solo los tickets registrados desde tu cuenta.'
                : 'Edita o asigna cualquier ticket desde aqui.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.4fr_0.4fr]">
            <Input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Buscar por titulo o descripcion"
            />

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value as TicketFilterState['status'],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado">
                  {filters.status === 'all'
                    ? 'Todos los estados'
                    : getStatusLabel(filters.status)}
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
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  priority: value as TicketFilterState['priority'],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridad">
                  {filters.priority === 'all'
                    ? 'Todas las prioridades'
                    : getPriorityLabel(filters.priority)}
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
            <div className="editorial-inset rounded-md py-14 text-center text-muted-foreground">
              Cargando tickets...
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTickets.map((ticket) => {
                const assignee = ticket.assignedTo
                  ? getUserDisplayName(ticket.assignedTo as ApiLikeUser)
                  : 'Sin asignar';
                const emitter = ticket.emitter
                  ? getUserDisplayName(ticket.emitter as ApiLikeUser)
                  : 'No definido';
                const selectedAssigneeId = quickAssignments[ticket.id];
                const isAssigningThisTicket =
                  assignMutation.isPending &&
                  assignMutation.variables?.id === ticket.id;

                return (
                  <Card key={ticket.id} className="ticket-record-card rounded-(--radius-panel)">
                    <CardHeader className="px-5 pb-0 pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <CardDescription className="line-clamp-2 leading-6">
                            {ticket.description}
                          </CardDescription>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar ticket ${ticket.id}`}
                          onClick={() => handleEditClick(ticket)}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
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
                          <div className="mt-1 font-medium text-foreground">
                            {ticket.service?.name ?? 'No definido'}
                          </div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">SLA</div>
                          <div className="mt-1 font-medium text-foreground">
                            {ticket.slaMinutes ? `${ticket.slaMinutes} min` : 'Sin SLA'}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="editorial-label flex items-center gap-2">
                              <UserPlus2 className="h-3.5 w-3.5" />
                              Asignacion rapida
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Asigna o reasigna este ticket sin abrir el formulario.
                            </p>
                          </div>
                          <Badge variant="outline">
                            {ticket.assignedToId ? 'Con responsable' : 'Sin responsable'}
                          </Badge>
                        </div>

                        {technicianOptions.length > 0 ? (
                          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                            <Select
                              value={
                                selectedAssigneeId ??
                                (ticket.assignedToId ? String(ticket.assignedToId) : undefined)
                              }
                              onValueChange={(value) =>
                                setQuickAssignments((current) => ({
                                  ...current,
                                  [ticket.id]: String(value),
                                }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecciona tecnico o encargado" />
                              </SelectTrigger>
                              <SelectContent>
                                {technicianOptions.map((option) => (
                                  <SelectItem key={option.value} value={String(option.value)}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              type="button"
                              className="min-w-40 justify-center"
                              disabled={
                                assignMutation.isPending ||
                                !selectedAssigneeId ||
                                Number(selectedAssigneeId) === ticket.assignedToId
                              }
                              onClick={() => handleQuickAssign(ticket)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {isAssigningThisTicket
                                ? 'Asignando...'
                                : ticket.assignedToId
                                  ? 'Reasignar'
                                  : 'Asignar'}
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            No hay tecnicos o encargados activos disponibles para asignar.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>
                          <TicketIcon className="mr-1 inline h-3.5 w-3.5" />
                          #{ticket.id}
                        </span>
                        <span>
                          Actualizado {new Date(ticket.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">
                No hay tickets para mostrar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
