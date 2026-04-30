import { useDeferredValue, useMemo, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  GripVertical,
  KanbanSquare,
  List,
  Search,
  Table2,
  Ticket as TicketIcon,
  UserRound,
  XCircle,
} from 'lucide-react';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportDetailSheet, TicketReportSheet } from '@/features/reports';
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
import { getAppUserRole } from '@/features/users/schemas';
import { useTickets } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

type KanbanPageProps = {
  assignedToId?: number;
  title?: string;
  description?: string;
  emptyMessage?: string;
  badgeLabel?: string;
};

type BoardView = 'board' | 'list' | 'table';
type PriorityFilter = 'all' | TicketPriority;

const STATUS_COLUMNS: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed', 'cancelled'];

const STATUS_META: Record<
  TicketStatus,
  { icon: typeof CircleDot; accent: string; shell: string }
> = {
  open: {
    icon: CircleDot,
    accent: 'text-sky-600 dark:text-sky-300',
    shell: 'border-sky-200/80 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/20',
  },
  in_progress: {
    icon: Clock3,
    accent: 'text-amber-600 dark:text-amber-300',
    shell: 'border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20',
  },
  resolved: {
    icon: CheckCircle2,
    accent: 'text-emerald-600 dark:text-emerald-300',
    shell: 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20',
  },
  closed: {
    icon: KanbanSquare,
    accent: 'text-slate-600 dark:text-slate-300',
    shell: 'border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/30',
  },
  cancelled: {
    icon: XCircle,
    accent: 'text-rose-600 dark:text-rose-300',
    shell: 'border-rose-200/80 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20',
  },
};

const PRIORITY_ICON: Record<TicketPriority, typeof AlertTriangle> = {
  low: CircleDot,
  medium: Clock3,
  high: AlertTriangle,
  urgent: AlertTriangle,
};

function getAssigneeName(ticket: Ticket): string {
  if (!ticket.assignedTo) return 'Sin asignar';
  const first = ticket.assignedTo.firstName ?? '';
  const last = ticket.assignedTo.lastName ?? '';
  const fullName = `${first} ${last}`.trim();
  return fullName || ticket.assignedTo.name || ticket.assignedTo.email;
}

function normalizeStatus(value: string | undefined): TicketStatus {
  const normalized = (value ?? '').toLowerCase().trim();
  if (
    normalized === 'open' ||
    normalized === 'in_progress' ||
    normalized === 'resolved' ||
    normalized === 'closed' ||
    normalized === 'cancelled'
  ) {
    return normalized;
  }
  return 'open';
}

function normalizePriority(value: string | undefined): TicketPriority {
  const normalized = (value ?? '').toLowerCase().trim();
  if (
    normalized === 'low' ||
    normalized === 'medium' ||
    normalized === 'high' ||
    normalized === 'urgent'
  ) {
    return normalized;
  }
  return 'medium';
}

function canWriteReport(ticket: Ticket, role: string | undefined, userId: number | undefined) {
  if (role === 'admin') return false;
  if (!userId) return false;
  return ticket.assignedToId === userId;
}

function hasTicketReport(ticket: Ticket) {
  return Boolean(ticket.report?.id);
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

export function KanbanPage({
  assignedToId,
  title = 'Tablero Kanban UTI',
  description = 'Tickets reales desde API. Arrastra tarjetas entre columnas para cambiar estado.',
  emptyMessage = 'Sin tickets',
  badgeLabel = 'tickets',
}: KanbanPageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { list, updateStatus } = useTickets();

  const [view, setView] = useState<BoardView>('board');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
  const [dragFromStatus, setDragFromStatus] = useState<TicketStatus | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TicketStatus | null>(null);
  const [reportTicketId, setReportTicketId] = useState<number | null>(null);
  const [reportDetailId, setReportDetailId] = useState<number | null>(null);

  const appRole = getAppUserRole(user);
  const isTechnicianView = Boolean(assignedToId) || appRole === 'agent';
  const effectiveAssignedToId = assignedToId ?? (appRole === 'agent' ? user?.id : undefined);
  const deferredSearch = useDeferredValue(search);

  const kanbanQueryKey = [
    'kanban-tickets',
    effectiveAssignedToId ?? 'all',
    deferredSearch,
    priorityFilter,
  ] as const;

  if (!assignedToId && appRole === 'agent') {
    return <Navigate to="/technician/kanban" replace />;
  }

  const { data: tickets = [], isLoading, isFetching } = useQuery<Ticket[]>({
    queryKey: kanbanQueryKey,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      list({
        page: 1,
        limit: 100,
        assignedToId: effectiveAssignedToId,
        search: deferredSearch || undefined,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      }),
  });

  const boardTickets = useMemo(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        status: normalizeStatus(ticket.status),
        priority: normalizePriority(ticket.priority),
      })),
    [tickets],
  );

  const reportTicket = useMemo(
    () => boardTickets.find((ticket) => ticket.id === reportTicketId) ?? null,
    [boardTickets, reportTicketId],
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: number; status: TicketStatus; comment?: string }) =>
      updateStatus(id, { status, comment }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: kanbanQueryKey });
      const previous = queryClient.getQueryData<Ticket[]>(kanbanQueryKey) ?? [];

      queryClient.setQueryData<Ticket[]>(kanbanQueryKey, (current = []) =>
        current.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                status,
                updatedAt: new Date().toISOString(),
              }
            : ticket,
        ),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(kanbanQueryKey, context.previous);
      }
      toast.error('No se pudo mover el ticket. Se revirtio el cambio.');
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData<Ticket[]>(kanbanQueryKey, (current = []) =>
        current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
      );
      syncUpdatedTicketCaches(queryClient, updatedTicket);
      invalidateTicketCaches(queryClient);
    },
  });

  const columns = useMemo(
    () =>
      STATUS_COLUMNS.map((status) => ({
        key: status,
        title: getStatusLabel(status),
        tickets: boardTickets.filter((ticket) => ticket.status === status),
      })),
    [boardTickets],
  );

  const totalTickets = boardTickets.length;
  const activeColumns = columns.filter((column) => column.tickets.length > 0).length;
  const isEmpty = totalTickets === 0;

  function openReport(ticket: Ticket) {
    if (appRole === 'admin') {
      if (ticket.report?.id) {
        setReportDetailId(ticket.report.id);
      }
      return;
    }

    setReportTicketId(ticket.id);
  }

  function onCardDragStart(event: DragEvent<HTMLDivElement>, ticketId: number, sourceStatus: TicketStatus) {
    setDraggedTicketId(ticketId);
    setDragFromStatus(sourceStatus);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(ticketId));
  }

  function onColumnDragOver(event: DragEvent<HTMLElement>, status: TicketStatus) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  }

  function resetDragState() {
    setDraggedTicketId(null);
    setDragFromStatus(null);
    setDragOverStatus(null);
  }

  function onColumnDrop(event: DragEvent<HTMLElement>, targetStatus: TicketStatus) {
    event.preventDefault();
    const ticketId = draggedTicketId ?? Number(event.dataTransfer.getData('text/plain'));
    const sourceStatus = dragFromStatus;

    if (!ticketId || !sourceStatus || sourceStatus === targetStatus) {
      resetDragState();
      return;
    }

    statusMutation.mutate({
      id: ticketId,
      status: targetStatus,
      comment: `Movimiento desde ${getStatusLabel(sourceStatus)} a ${getStatusLabel(targetStatus)} desde Kanban`,
    });

    resetDragState();
  }

  return (
    <>
      <section className="space-y-4">
        <header className="overflow-hidden rounded-[var(--radius-panel)] border border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_40%),var(--card)] p-5 shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <KanbanSquare className="h-3.5 w-3.5 text-primary" />
                {isTechnicianView ? 'Flujo tecnico' : 'Operacion de tickets'}
              </div>
              <h1 className="mt-3 text-base font-semibold sm:text-lg">{title}</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {totalTickets} {badgeLabel}
              </Badge>
              <Badge variant="outline">{activeColumns} columnas activas</Badge>
              {isTechnicianView ? <Badge variant="outline">Reporte integrado</Badge> : null}

              <div className="flex rounded-md border bg-muted/40 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'board' ? 'default' : 'ghost'}
                  onClick={() => setView('board')}
                >
                  <KanbanSquare className="mr-2 h-4 w-4" />
                  Board
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'list' ? 'default' : 'ghost'}
                  onClick={() => setView('list')}
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'table' ? 'default' : 'ghost'}
                  onClick={() => setView('table')}
                >
                  <Table2 className="mr-2 h-4 w-4" />
                  Table
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar por titulo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por prioridad">
                  {priorityFilter === 'all' ? 'Todas las prioridades' : getPriorityLabel(priorityFilter)}
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
        </header>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Cargando tickets...</CardContent>
          </Card>
        ) : null}

        {view === 'board' && !isLoading ? (
          isEmpty ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {columns.map((column) => {
                const meta = STATUS_META[column.key];
                const StatusIcon = meta.icon;

                return (
                  <article
                    key={column.key}
                    className={cn(
                      'flex min-h-[520px] flex-col rounded-[var(--radius-panel)] border shadow-[var(--shadow-1)] transition-all',
                      meta.shell,
                      dragOverStatus === column.key && 'border-primary/60 ring-2 ring-primary/15',
                    )}
                    onDragOver={(event) => onColumnDragOver(event, column.key)}
                    onDrop={(event) => onColumnDrop(event, column.key)}
                    onDragLeave={() => setDragOverStatus(null)}
                  >
                    <div className="border-b border-border/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className={cn('rounded-md border bg-background/80 p-1.5', meta.accent)}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold">{column.title}</h2>
                            <p className="text-xs text-muted-foreground">{column.tickets.length} ticket(s)</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {column.tickets.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                      {column.tickets.map((ticket) => {
                        const PriorityIcon = PRIORITY_ICON[ticket.priority];
                        const allowReport = canWriteReport(ticket, appRole, user?.id);
                        const allowAdminReportView = appRole === 'admin' && hasTicketReport(ticket);
                        const showDisabledAdminReport = appRole === 'admin' && !hasTicketReport(ticket);

                        return (
                          <Card
                            key={ticket.id}
                            className={cn(
                              'cursor-grab border-border/70 bg-card/95 shadow-[var(--shadow-1)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] active:cursor-grabbing',
                              draggedTicketId === ticket.id && 'opacity-60',
                            )}
                            draggable
                            onDragStart={(event) => onCardDragStart(event, ticket.id, column.key)}
                            onDragEnd={resetDragState}
                          >
                            <CardHeader className="gap-3 pb-2">
                              <div className="flex items-start gap-2">
                                <div className="rounded-md border bg-muted/60 p-1 text-muted-foreground">
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-2">
                                    <CardTitle className="min-w-0 flex-1 break-all pr-1 text-sm leading-5 text-foreground">
                                      {ticket.title}
                                    </CardTitle>
                                    <Badge className={cn('shrink-0 border', getPriorityColor(ticket.priority))}>
                                      <PriorityIcon className="mr-1 h-3 w-3" />
                                      {getPriorityLabel(ticket.priority)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Badge variant="outline" className="shrink-0">
                                  <TicketIcon className="mr-1 h-3 w-3" />
                                  #{ticket.id}
                                </Badge>
                                <Badge className={cn('border', getStatusColor(ticket.status))}>
                                  {getStatusLabel(ticket.status)}
                                </Badge>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-0 text-xs">
                              <p className="line-clamp-3 leading-5 text-muted-foreground">{ticket.description}</p>

                              <div className="grid gap-2">
                                <div className="rounded-md border border-border/60 bg-muted/35 px-3 py-2">
                                  <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <UserRound className="h-3 w-3" />
                                    Asignado
                                  </div>
                                  <p className="break-words font-medium text-foreground">{getAssigneeName(ticket)}</p>
                                </div>
                                <div className="rounded-md border border-border/60 bg-muted/35 px-3 py-2">
                                  <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <Clock3 className="h-3 w-3" />
                                    Actualizado
                                  </div>
                                  <p className="text-foreground">{new Date(ticket.updatedAt).toLocaleString('es-BO')}</p>
                                </div>
                              </div>

                              {allowReport ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-center"
                                  draggable={false}
                                  onMouseDown={(event) => event.stopPropagation()}
                                  onClick={() => openReport(ticket)}
                                >
                                  <ClipboardCheck className="mr-2 h-4 w-4" />
                                  {ticket.report?.id ? 'Editar reporte' : 'Abrir reporte'}
                                </Button>
                              ) : allowAdminReportView ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-center"
                                  draggable={false}
                                  onMouseDown={(event) => event.stopPropagation()}
                                  onClick={() => openReport(ticket)}
                                >
                                  <ClipboardCheck className="mr-2 h-4 w-4" />
                                  Ver reporte
                                </Button>
                              ) : showDisabledAdminReport ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-center"
                                  draggable={false}
                                  disabled
                                >
                                  <ClipboardCheck className="mr-2 h-4 w-4" />
                                  Sin reporte
                                </Button>
                              ) : null}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {column.tickets.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border/70 bg-background/40 p-4 text-xs text-muted-foreground">
                          Sin tickets
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : null}

        {view === 'list' && !isLoading ? (
          isEmpty ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div className="space-y-3">
              {columns.map((column) => (
                <Card key={column.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {column.title} ({column.tickets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {column.tickets.map((ticket) => {
                      const allowReport = canWriteReport(ticket, appRole, user?.id);
                      const allowAdminReportView = appRole === 'admin' && hasTicketReport(ticket);
                      const showDisabledAdminReport = appRole === 'admin' && !hasTicketReport(ticket);

                      return (
                        <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground">
                              #{ticket.id} · {getAssigneeName(ticket)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn('border', getPriorityColor(ticket.priority))}>
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                            {allowReport ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => openReport(ticket)}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                {ticket.report?.id ? 'Editar reporte' : 'Abrir reporte'}
                              </Button>
                            ) : allowAdminReportView ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => openReport(ticket)}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Ver reporte
                              </Button>
                            ) : showDisabledAdminReport ? (
                              <Button type="button" size="sm" variant="outline" disabled>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Sin reporte
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {column.tickets.length === 0 ? <p className="text-sm text-muted-foreground">Sin tickets</p> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : null}

        {view === 'table' && !isLoading ? (
          isEmpty ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tabla de tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Titulo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Asignado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Accion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boardTickets.map((ticket) => {
                      const allowReport = canWriteReport(ticket, appRole, user?.id);
                      const allowAdminReportView = appRole === 'admin' && hasTicketReport(ticket);

                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">#{ticket.id}</TableCell>
                          <TableCell>{ticket.title}</TableCell>
                          <TableCell>
                            <Badge className={cn('border', getStatusColor(ticket.status))}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('border', getPriorityColor(ticket.priority))}>
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getAssigneeName(ticket)}</TableCell>
                          <TableCell>{new Date(ticket.createdAt).toLocaleDateString('es-BO')}</TableCell>
                          <TableCell className="text-right">
                            {allowReport ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => openReport(ticket)}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                {ticket.report?.id ? 'Editar reporte' : 'Abrir reporte'}
                              </Button>
                            ) : allowAdminReportView ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => openReport(ticket)}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Ver reporte
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {appRole === 'admin' ? 'Sin reporte' : 'Sin acceso'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : null}

        {isFetching && !isLoading ? (
          <p className="text-xs text-muted-foreground">Actualizando tablero...</p>
        ) : null}
      </section>

      {reportTicket ? (
        <TicketReportSheet
          open
          ticket={reportTicket}
          canWrite={canWriteReport(reportTicket, appRole, user?.id)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setReportTicketId(null);
            }
          }}
          onTicketUpdated={(updatedTicket) => {
            queryClient.setQueryData<Ticket[]>(kanbanQueryKey, (current = []) =>
              current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
            );
          }}
        />
      ) : null}

      <ReportDetailSheet
        open={Boolean(reportDetailId)}
        reportId={reportDetailId}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setReportDetailId(null);
          }
        }}
      />
    </>
  );
}