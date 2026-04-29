import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search } from 'lucide-react';
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
import { getDefaultRouteForUser, isAgent } from '@/features/users/schemas';
import { useReports } from '@/hooks/useApi';

type StatusFilter = 'all' | TicketStatus;

function getAssigneeName(report: Report) {
  const actor = report.ticket?.assignedTo;
  if (!actor) return 'Sin responsable';

  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return fullName || actor.name || actor.email || 'Sin responsable';
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function TechnicianReportsPage() {
  const { user } = useAuth();
  const { list } = useReports();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  if (!user) return null;
  if (!isAgent(user)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['technician-reports', user.id],
    enabled: Boolean(user.id),
    queryFn: async () => list({ createdById: user.id, limit: 100 }),
  });

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reports.filter((ticket) => {
      const matchesStatus = status === 'all' || ticket.ticket?.status === status;
      const componentNames = (ticket.components ?? [])
        .map((component) => component.component?.name ?? '')
        .join(' ')
        .toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        ticket.summary.toLowerCase().includes(term) ||
        ticket.workPerformed.toLowerCase().includes(term) ||
        ticket.resolutionType?.toLowerCase().includes(term) === true ||
        ticket.ticket?.title.toLowerCase().includes(term) === true ||
        componentNames.includes(term) ||
        String(ticket.id).includes(term) ||
        String(ticket.ticketId).includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [reports, search, status]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Seguimiento personal</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Mis reportes
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Aqui puedes ver los reportes tecnicos que registraste y seguir el estado del ticket asociado.
          </p>
        </div>
      </section>

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Busqueda y estado</CardTitle>
          <CardDescription>Filtra tus reportes para encontrar lo que necesitas revisar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1.3fr_0.5fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ticket, resumen, trabajo realizado, componente o ID"
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
          <CardTitle>Historial de reportes</CardTitle>
          <CardDescription>{filteredReports.length} reporte(s) encontrados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando reportes...</p>
          ) : filteredReports.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredReports.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedReport(ticket)}
                  className="ticket-record-card group flex w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border/60 bg-card text-left shadow-[var(--shadow-1)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CardHeader className="px-5 pb-0 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {ticket.ticket?.status ? (
                            <Badge className={getStatusColor(ticket.ticket.status)}>
                              {getStatusLabel(ticket.ticket.status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sin ticket</Badge>
                          )}
                          {ticket.ticket?.priority ? (
                            <Badge className={getPriorityColor(ticket.ticket.priority)}>
                              {getPriorityLabel(ticket.ticket.priority)}
                            </Badge>
                          ) : null}
                          {ticket.resolutionType ? (
                            <Badge variant="secondary">{ticket.resolutionType}</Badge>
                          ) : null}
                        </div>
                        <CardTitle className="text-lg">
                          {ticket.ticket?.title ?? `Ticket #${ticket.ticketId}`}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 leading-6">
                          {ticket.summary}
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
                        {ticket.workPerformed}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Responsable</div>
                        <div className="mt-1 font-medium text-foreground">
                          {getAssigneeName(ticket)}
                        </div>
                      </div>
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Servicio</div>
                        <div className="mt-1 font-medium text-foreground">
                          {ticket.ticket?.service?.name ?? 'Sin servicio'}
                        </div>
                      </div>
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Componentes</div>
                        <div className="mt-1 font-medium text-foreground">
                          {(ticket.components ?? []).length > 0
                            ? `${ticket.components?.length ?? 0} registrado(s)`
                            : 'Sin componentes'}
                        </div>
                      </div>
                    </div>

                    {(ticket.components ?? []).length > 0 ? (
                      <div className="space-y-2">
                        <div className="editorial-label">Detalle de componentes</div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {ticket.components
                            ?.map((component) =>
                              component.component?.name
                                ? `${component.component.name} x${component.quantity}`
                                : `Componente #${component.componentId} x${component.quantity}`,
                            )
                            .join(', ')}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Reporte #{ticket.id}</span>
                      <span>Ticket #{ticket.ticketId}</span>
                      <span>Registrado {formatDate(ticket.createdAt)}</span>
                    </div>

                    <div className="text-xs font-medium text-primary/80 transition-colors group-hover:text-primary">
                      Ver detalle del reporte
                    </div>
                  </CardContent>
                </button>
              ))}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">No hay reportes para mostrar</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cuando completes un reporte tecnico desde tus tickets asignados aparecera aqui.
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
