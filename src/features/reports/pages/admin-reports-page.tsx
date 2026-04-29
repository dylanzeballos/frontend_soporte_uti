import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, FileText, Search, Users2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ReportDetailSheet } from '@/features/reports/components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Report } from '@/features/reports/schemas';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type TicketStatus,
} from '@/features/tickets/schemas/ticket.schema';
import { getDefaultRouteForUser, isAdmin } from '@/features/users/schemas';
import { useReports } from '@/hooks/useApi';

type StatusFilter = 'all' | TicketStatus;

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getActorName(actor?: Report['createdBy'] | null) {
  if (!actor) return 'Sin tecnico';

  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return fullName || actor.name || actor.email || 'Sin tecnico';
}

function getAssigneeName(report: Report) {
  const actor = report.ticket?.assignedTo;
  if (!actor) return 'Sin responsable';

  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return fullName || actor.name || actor.email || 'Sin responsable';
}

function isActiveTicketStatus(status?: TicketStatus | null) {
  return status === 'open' || status === 'in_progress';
}

export function AdminReportsPage() {
  const { user } = useAuth();
  const { list } = useReports();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  if (!user) return null;
  if (!isAdmin(user)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['admin-reports'],
    queryFn: async () => list({ limit: 100 }),
  });

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus = status === 'all' || report.ticket?.status === status;
      const componentNames = (report.components ?? [])
        .map((component) => component.component?.name ?? '')
        .join(' ')
        .toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        report.summary.toLowerCase().includes(term) ||
        report.workPerformed.toLowerCase().includes(term) ||
        report.resolutionType?.toLowerCase().includes(term) === true ||
        report.ticket?.title.toLowerCase().includes(term) === true ||
        getActorName(report.createdBy).toLowerCase().includes(term) ||
        getAssigneeName(report).toLowerCase().includes(term) ||
        String(report.id).includes(term) ||
        String(report.ticketId).includes(term) ||
        componentNames.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [reports, search, status]);

  const stats = useMemo(() => {
    const technicians = new Set(
      reports
        .map((report) => report.createdById ?? report.createdBy?.id ?? null)
        .filter((value): value is number => typeof value === 'number'),
    );

    return {
      total: reports.length,
      active: reports.filter((report) => isActiveTicketStatus(report.ticket?.status)).length,
      completed: reports.filter(
        (report) => report.ticket?.status === 'resolved' || report.ticket?.status === 'closed',
      ).length,
      technicians: technicians.size,
    };
  }, [reports]);

  const statCards = [
    {
      title: 'Reportes',
      value: stats.total,
      description: 'Reportes tecnicos registrados.',
      icon: FileText,
    },
    {
      title: 'Activos',
      value: stats.active,
      description: 'Siguen con ticket abierto o en progreso.',
      icon: Clock3,
    },
    {
      title: 'Completados',
      value: stats.completed,
      description: 'Asociados a tickets cerrados o resueltos.',
      icon: CheckCircle2,
    },
    {
      title: 'Tecnicos',
      value: stats.technicians,
      description: 'Personal con reportes registrados.',
      icon: Users2,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Seguimiento de soporte</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Reportes tecnicos
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Aqui puedes revisar los reportes registrados por el equipo tecnico, su avance y el
            contexto del ticket relacionado.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
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

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Busqueda y estado</CardTitle>
          <CardDescription>
            Filtra por tecnico, ticket, resumen, componentes o estado del ticket.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1.3fr_0.5fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por tecnico, ticket, resumen, componente o ID"
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
          <CardTitle>Listado de reportes</CardTitle>
          <CardDescription>{filteredReports.length} reporte(s) encontrados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando reportes...</p>
          ) : filteredReports.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredReports.map((report) => {
                const componentSummary = (report.components ?? [])
                  .map((component) =>
                    component.component?.name
                      ? `${component.component.name} x${component.quantity}`
                      : `Componente #${component.componentId} x${component.quantity}`,
                  )
                  .join(', ');

                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReport(report)}
                    className="ticket-record-card group flex w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border/60 bg-card text-left shadow-[var(--shadow-1)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CardHeader className="px-5 pb-0 pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {report.ticket?.status ? (
                              <Badge className={getStatusColor(report.ticket.status)}>
                                {getStatusLabel(report.ticket.status)}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sin ticket</Badge>
                            )}
                            {report.ticket?.priority ? (
                              <Badge className={getPriorityColor(report.ticket.priority)}>
                                {getPriorityLabel(report.ticket.priority)}
                              </Badge>
                            ) : null}
                            {report.resolutionType ? (
                              <Badge variant="secondary">{report.resolutionType}</Badge>
                            ) : null}
                          </div>
                          <CardTitle className="text-lg">
                            {report.ticket?.title ?? `Ticket #${report.ticketId}`}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 leading-6">
                            {report.summary}
                          </CardDescription>
                        </div>

                        <div className="ticket-entry-icon h-11 w-11 shrink-0 rounded-full">
                          <FileText className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-4 px-5 pb-5 pt-4 text-sm">
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Trabajo realizado</div>
                        <p className="mt-1 line-clamp-4 leading-6 text-foreground">
                          {report.workPerformed}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Tecnico</div>
                          <div className="mt-1 font-medium text-foreground">
                            {getActorName(report.createdBy)}
                          </div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Asignado a</div>
                          <div className="mt-1 font-medium text-foreground">
                            {getAssigneeName(report)}
                          </div>
                        </div>
                        <div className="editorial-inset rounded-md p-3.5">
                          <div className="editorial-label">Servicio</div>
                          <div className="mt-1 font-medium text-foreground">
                            {report.ticket?.service?.name ?? 'Sin servicio'}
                          </div>
                        </div>
                      </div>

                      {componentSummary ? (
                        <div className="space-y-2">
                          <div className="editorial-label">Componentes registrados</div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {componentSummary}
                          </p>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>Reporte #{report.id}</span>
                        <span>Ticket #{report.ticketId}</span>
                        <span>Registrado {formatDate(report.createdAt)}</span>
                      </div>

                      <div className="text-xs font-medium text-primary/80 transition-colors group-hover:text-primary">
                        Ver detalle del reporte
                      </div>
                    </CardContent>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">No hay reportes para mostrar</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cuando el equipo tecnico registre reportes apareceran en este apartado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ReportDetailSheet
        open={Boolean(selectedReport)}
        report={selectedReport}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReport(null);
          }
        }}
      />
    </div>
  );
}
