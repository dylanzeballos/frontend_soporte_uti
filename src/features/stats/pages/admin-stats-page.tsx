import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Clock3,
  FileText,
  PackagePlus,
  Ticket as TicketIcon,
  TrendingUp,
  Users2,
  Wrench,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReportSummaryStats } from '@/features/reports';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type TicketPriority,
  type TicketStatus,
} from '@/features/tickets/schemas/ticket.schema';
import { getDefaultRouteForUser, isAdmin } from '@/features/users/schemas';
import { useReports, useUnits } from '@/hooks/useApi';

const statusOrder: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed', 'cancelled'];
const priorityOrder: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

function toStartOfDayIso(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

function toEndOfDayIso(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

function getMaxCount(items: Array<{ count: number }>) {
  return Math.max(...items.map((item) => item.count), 1);
}

function getBarWidth(value: number, max: number) {
  return `${Math.max((value / max) * 100, value > 0 ? 10 : 0)}%`;
}

function EmptyMetricState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function MetricBars({
  items,
  renderLabel,
  renderBadge,
  emptyMessage,
}: {
  items: Array<{ key: string; count: number }>;
  renderLabel: (item: { key: string; count: number }) => string;
  renderBadge?: (item: { key: string; count: number }) => ReactNode;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <EmptyMetricState message={emptyMessage} />;
  }

  const max = getMaxCount(items);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-sm font-medium text-foreground">{renderLabel(item)}</div>
            <div className="flex items-center gap-2">
              {renderBadge?.(item)}
              <span className="text-xs font-semibold text-muted-foreground">{item.count}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted/70">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: getBarWidth(item.count, max) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminStatsPage() {
  const { user } = useAuth();
  const { getSummaryStats } = useReports();
  const { list: listUnits } = useUnits();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [corporationId, setCorporationId] = useState('all');

  if (!user) return null;
  if (!isAdmin(user)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  const { data: units = [] } = useQuery({
    queryKey: ['stats-units'],
    queryFn: () => listUnits(),
  });

  const statsFilters = useMemo(
    () => ({
      fromDate: toStartOfDayIso(fromDate),
      toDate: toEndOfDayIso(toDate),
      corporationId: corporationId === 'all' ? undefined : Number(corporationId),
    }),
    [corporationId, fromDate, toDate],
  );

  const { data: stats, isLoading } = useQuery<ReportSummaryStats | null>({
    queryKey: ['admin-stats', statsFilters.fromDate, statsFilters.toDate, statsFilters.corporationId ?? 'all'],
    queryFn: () => getSummaryStats(statsFilters),
  });

  const statusItems = useMemo(
    () =>
      statusOrder.map((status) => ({
        key: status,
        count: stats?.byStatus.find((item) => item.status === status)?.count ?? 0,
      })),
    [stats],
  );

  const priorityItems = useMemo(
    () =>
      priorityOrder.map((priority) => ({
        key: priority,
        count: stats?.byPriority.find((item) => item.priority === priority)?.count ?? 0,
      })),
    [stats],
  );

  const topUnit = stats?.byUnit[0] ?? null;
  const topComponent = stats?.topComponents[0] ?? null;

  const statCards = [
    {
      title: 'Tickets',
      value: stats?.totals.tickets ?? 0,
      description: 'Solicitudes dentro del filtro actual.',
      icon: TicketIcon,
    },
    {
      title: 'Reportes',
      value: stats?.totals.reports ?? 0,
      description: 'Tickets con atencion documentada.',
      icon: FileText,
    },
    {
      title: 'Promedio resolucion',
      value:
        typeof stats?.totals.averageResolutionHours === 'number'
          ? `${stats.totals.averageResolutionHours} h`
          : 'N/D',
      description: 'Tiempo medio desde creacion hasta resolucion.',
      icon: Clock3,
    },
    {
      title: 'Tecnicos activos',
      value: stats?.byTechnician.length ?? 0,
      description: 'Tecnicos con actividad en el rango.',
      icon: Users2,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Analitica operativa</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Estadisticas del sistema
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Revisa volumen de solicitudes, distribucion por estado y prioridad, unidades con mayor actividad, servicios mas solicitados y componentes que mas cambios requieren.
          </p>
        </div>
      </section>

      <Card className="rounded-[var(--radius-panel)]">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Ajusta rango de fechas y unidad para enfocar la vista administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="stats-from-date" className="text-sm font-medium text-muted-foreground">
              Desde
            </label>
            <Input
              id="stats-from-date"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="stats-to-date" className="text-sm font-medium text-muted-foreground">
              Hasta
            </label>
            <Input
              id="stats-to-date"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="stats-unit" className="text-sm font-medium text-muted-foreground">
              Unidad
            </label>
            <Select value={corporationId} onValueChange={(value) => setCorporationId(value ?? 'all')}>
              <SelectTrigger id="stats-unit">
                <SelectValue placeholder="Todas las unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las unidades</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={String(unit.id)}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Distribucion por estado</CardTitle>
            <CardDescription>
              {isLoading ? 'Cargando...' : 'Como se reparten las solicitudes segun su estado actual.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricBars
              items={statusItems}
              renderLabel={(item) => getStatusLabel(item.key as TicketStatus)}
              renderBadge={(item) => (
                <Badge className={getStatusColor(item.key as TicketStatus)}>
                  {getStatusLabel(item.key as TicketStatus)}
                </Badge>
              )}
              emptyMessage="No hay tickets dentro del filtro seleccionado."
            />
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Distribucion por prioridad</CardTitle>
            <CardDescription>
              Ayuda a detectar si el volumen se concentra en incidencias criticas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricBars
              items={priorityItems}
              renderLabel={(item) => getPriorityLabel(item.key as TicketPriority)}
              renderBadge={(item) => (
                <Badge className={getPriorityColor(item.key as TicketPriority)}>
                  {getPriorityLabel(item.key as TicketPriority)}
                </Badge>
              )}
              emptyMessage="No hay prioridades registradas para este filtro."
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Servicios mas solicitados</CardTitle>
            <CardDescription>Detecta en que tipo de soporte se concentra la demanda.</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricBars
              items={(stats?.topServices ?? []).map((item) => ({
                key: String(item.serviceId),
                count: item.count,
              }))}
              renderLabel={(item) =>
                stats?.topServices.find((service) => String(service.serviceId) === item.key)?.name ??
                `Servicio #${item.key}`
              }
              emptyMessage="Aun no hay servicios con actividad en este rango."
            />
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Unidades con mayor actividad</CardTitle>
            <CardDescription>Muestra donde se estan generando mas solicitudes.</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricBars
              items={(stats?.byUnit ?? []).map((item) => ({
                key: String(item.corporationId ?? 'without-unit'),
                count: item.count,
              }))}
              renderLabel={(item) =>
                stats?.byUnit.find(
                  (unit) => String(unit.corporationId ?? 'without-unit') === item.key,
                )?.name ?? 'Sin unidad'
              }
              emptyMessage="No hay unidades con datos en este filtro."
            />
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Actividad por tecnico</CardTitle>
            <CardDescription>Cuantos reportes registraron los tecnicos en el rango.</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricBars
              items={(stats?.byTechnician ?? []).map((item) => ({
                key: String(item.userId),
                count: item.count,
              }))}
              renderLabel={(item) =>
                stats?.byTechnician.find((technician) => String(technician.userId) === item.key)?.name ??
                `Tecnico #${item.key}`
              }
              emptyMessage="Aun no hay actividad tecnica en este filtro."
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Componentes con mayor necesidad de cambio</CardTitle>
            <CardDescription>
              Basado en los reportes tecnicos registrados para los tickets filtrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.topComponents ?? []).length > 0 ? (
              stats?.topComponents.map((component) => (
                <div
                  key={component.componentId}
                  className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{component.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Usos en reportes: {component.usageCount}
                      </p>
                    </div>
                    <Badge variant="secondary">Cantidad total: {component.totalQuantity}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyMetricState message="No hay componentes registrados para este filtro." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Lecturas clave</CardTitle>
            <CardDescription>Resumen rapido para apoyar decisiones administrativas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="editorial-inset rounded-2xl p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Unidad con mayor carga
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {topUnit
                  ? `${topUnit.name} concentra ${topUnit.count} ticket(s) dentro del filtro actual.`
                  : 'Todavia no hay suficiente informacion para este rango.'}
              </p>
            </div>

            <div className="editorial-inset rounded-2xl p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <PackagePlus className="h-4 w-4 text-primary" />
                Componente mas recurrente
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {topComponent
                  ? `${topComponent.name} aparece en ${topComponent.usageCount} reporte(s) con ${topComponent.totalQuantity} unidad(es) registradas.`
                  : 'No se registraron cambios de componentes en este filtro.'}
              </p>
            </div>

            <div className="editorial-inset rounded-2xl p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                Estado operativo
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {stats
                  ? `Hay ${stats.totals.open + stats.totals.inProgress} ticket(s) activos y ${stats.totals.cancelled} cancelado(s) en el rango actual.`
                  : 'Cargando resumen operativo...'}
              </p>
            </div>

            <div className="editorial-inset rounded-2xl p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Wrench className="h-4 w-4 text-primary" />
                Cobertura tecnica
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {stats
                  ? `${stats.totals.reports} ticket(s) ya cuentan con reporte tecnico documentado dentro del filtro.`
                  : 'Cargando cobertura tecnica...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
