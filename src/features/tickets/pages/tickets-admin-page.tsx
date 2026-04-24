import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilLine, ShieldCheck, Ticket as TicketIcon } from 'lucide-react';
import { toast } from 'sonner';

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
import type { User } from '@/features/users/schemas';
import { useTickets, useUsers } from '@/hooks/useApi';

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
    const roleLabel = apiUser.role?.name;

    return {
      value: user.id,
      label: getUserDisplayName(apiUser),
      description: roleLabel || user.email,
    };
  });
}

function buildServiceOptions(tickets: Ticket[]): TicketSelectOption[] {
  const serviceMap = new Map<number, TicketSelectOption>();

  tickets.forEach((ticket) => {
    if (ticket.service) {
      serviceMap.set(ticket.service.id, {
        value: ticket.service.id,
        label: ticket.service.name,
      });
    }
  });

  return Array.from(serviceMap.values());
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
  const queryClient = useQueryClient();
  const { list, update } = useTickets();
  const { list: listUsers } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState<TicketFilterState>({
    search: '',
    status: 'all',
    priority: 'all',
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: list,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['ticket-form-users'],
    queryFn: listUsers,
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
  const serviceOptions = buildServiceOptions(tickets);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      filters.search.trim().length === 0 ||
      ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
    const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const isSubmitting = updateMutation.isPending;

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

  const formServiceOptions =
    selectedTicket?.service && !serviceOptions.some((option) => option.value === selectedTicket.service?.id)
      ? [...serviceOptions, { value: selectedTicket.service.id, label: selectedTicket.service.name }]
      : serviceOptions;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Gestion administrativa
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Recepcion y gestion de tickets</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Esta vista es para el admin o agente cuando recibe un ticket y necesita registrar datos internos como prioridad, asignacion, estado o SLA.
            </p>
          </div>
        </div>
      </section>

      {showForm ? (
        <TicketForm
          variant="admin"
          mode={selectedTicket ? 'edit' : 'create'}
          initialValues={selectedTicket ? toFormValues(selectedTicket) : undefined}
          assigneeOptions={userOptions}
          emitterOptions={userOptions}
          serviceOptions={formServiceOptions}
          isSubmitting={isSubmitting}
          submitLabel={selectedTicket ? 'Guardar ticket' : 'Registrar recepcion'}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
        />
      ) : null}

      <Card className="border border-primary/10 shadow-sm">
        <CardHeader className="gap-3 border-b border-primary/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Panel administrativo</CardTitle>
              <CardDescription>
                Revisa tickets recibidos, filtra el backlog y abre cualquier registro para editar su gestion interna.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {usersLoading ? 'Cargando responsables...' : `${userOptions.length} usuarios disponibles para asignacion`}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.4fr_0.4fr]">
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Buscar por titulo o descripcion"
              className="bg-card"
            />

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, status: value as TicketFilterState['status'] }))
              }
            >
              <SelectTrigger className="w-full bg-card">
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
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, priority: value as TicketFilterState['priority'] }))
              }
            >
              <SelectTrigger className="w-full bg-card">
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
            <div className="rounded-xl border border-dashed border-primary/15 bg-primary/5 py-12 text-center text-muted-foreground">
              Cargando tickets...
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTickets.map((ticket) => {
                const assignee = ticket.assignedTo ? getUserDisplayName(ticket.assignedTo as ApiLikeUser) : 'Sin asignar';
                const emitter = ticket.emitter ? getUserDisplayName(ticket.emitter as ApiLikeUser) : 'No definido';

                return (
                  <Card
                    key={ticket.id}
                    className="border border-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardHeader className="gap-4 border-b border-primary/10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <CardDescription className="line-clamp-2 leading-6">{ticket.description}</CardDescription>
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
                        <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-3 pt-6 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-muted/60 p-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Asignado</div>
                          <div className="mt-1 font-medium text-foreground">{assignee}</div>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Emisor</div>
                          <div className="mt-1 font-medium text-foreground">{emitter}</div>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Servicio</div>
                          <div className="mt-1 font-medium text-foreground">{ticket.service?.name ?? 'No definido'}</div>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">SLA</div>
                          <div className="mt-1 font-medium text-foreground">
                            {ticket.slaMinutes ? `${ticket.slaMinutes} min` : 'Sin SLA'}
                          </div>
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
            <div className="rounded-xl border border-dashed border-primary/15 bg-primary/5 py-12 text-center">
              <p className="text-base font-medium text-foreground">No hay tickets para mostrar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajusta los filtros para revisar el backlog administrativo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
