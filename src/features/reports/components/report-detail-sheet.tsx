import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  PackagePlus,
  UserRound,
  Wrench,
  XIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Report } from '@/features/reports/schemas';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from '@/features/tickets/schemas/ticket.schema';
import { useReports } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface ReportDetailSheetProps {
  open: boolean;
  report?: Report | null;
  reportId?: number | null;
  onOpenChange: (open: boolean) => void;
}

type TicketActor = NonNullable<NonNullable<Report['ticket']>['assignedTo']>;

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No registrado';

  return new Date(value).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActorName(actor?: Report['createdBy'] | null) {
  if (!actor) return 'Sin tecnico';

  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return fullName || actor.name || actor.email || 'Sin tecnico';
}

function getTicketActorName(actor?: TicketActor | null) {
  if (!actor) return 'No registrado';

  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return fullName || actor.name || actor.email || 'No registrado';
}

export function ReportDetailSheet({
  open,
  report,
  reportId,
  onOpenChange,
}: ReportDetailSheetProps) {
  const { findOne } = useReports();
  const targetReportId = reportId ?? report?.id ?? null;

  const { data: fetchedReport = null, isLoading } = useQuery<Report | null>({
    queryKey: ['report-detail', targetReportId ?? 0],
    enabled: open && Boolean(targetReportId),
    queryFn: () => (targetReportId ? findOne(targetReportId) : Promise.resolve(null)),
  });

  const currentReport = fetchedReport ?? report;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[min(92vh,960px)] w-[min(980px,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border/60 bg-background shadow-[var(--shadow-3)] transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon-sm" className="absolute right-4 top-4 z-10" />}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Cerrar detalle</span>
          </DialogPrimitive.Close>

          <div className="border-b bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_40%),var(--card)] px-5 py-5 sm:px-7">
            <div className="space-y-3 pr-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <FileText className="h-3.5 w-3.5" />
                Detalle del reporte
              </div>
              <DialogPrimitive.Title className="text-xl font-semibold leading-7 text-foreground">
                {currentReport?.ticket?.title ?? (currentReport ? `Ticket #${currentReport.ticketId}` : 'Reporte tecnico')}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa el resumen, el trabajo realizado, la atencion asociada y los componentes
                registrados por el tecnico.
              </DialogPrimitive.Description>

              {currentReport ? (
                <div className="flex flex-wrap gap-2">
                  {currentReport.ticket?.status ? (
                    <Badge className={cn('border', getStatusColor(currentReport.ticket.status))}>
                      {getStatusLabel(currentReport.ticket.status)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Sin ticket</Badge>
                  )}
                  {currentReport.ticket?.priority ? (
                    <Badge className={cn('border', getPriorityColor(currentReport.ticket.priority))}>
                      {getPriorityLabel(currentReport.ticket.priority)}
                    </Badge>
                  ) : null}
                  {currentReport.resolutionType ? (
                    <Badge variant="secondary">{currentReport.resolutionType}</Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            {isLoading && !fetchedReport ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                Cargando detalle del reporte...
              </div>
            ) : !currentReport ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                No se pudo cargar el reporte seleccionado.
              </div>
            ) : (
              <>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Reporte
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">#{currentReport.id}</div>
                  </div>
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Ticket
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">#{currentReport.ticketId}</div>
                  </div>
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5" />
                      Tecnico
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {getActorName(currentReport.createdBy)}
                    </div>
                  </div>
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Registrado
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {formatDate(currentReport.createdAt)}
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Resultado del reporte</h3>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Resumen</div>
                      <p className="mt-2 text-sm leading-6 text-foreground">{currentReport.summary}</p>
                    </div>
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Trabajo realizado</div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {currentReport.workPerformed}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Contexto del ticket</h3>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Descripcion del ticket</div>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {currentReport.ticket?.description ?? 'Cargando descripcion...'}
                      </p>
                    </div>
                    <div className="grid gap-3">
                      <div className="editorial-inset rounded-2xl p-4">
                        <div className="editorial-label">Servicio</div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {currentReport.ticket?.service?.name ?? 'Sin servicio'}
                        </p>
                      </div>
                      <div className="editorial-inset rounded-2xl p-4">
                        <div className="editorial-label">Asignado a</div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {getTicketActorName(currentReport.ticket?.assignedTo)}
                        </p>
                      </div>
                      <div className="editorial-inset rounded-2xl p-4">
                        <div className="editorial-label">Solicitante</div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {getTicketActorName(currentReport.ticket?.createdBy)}
                        </p>
                      </div>
                      <div className="editorial-inset rounded-2xl p-4">
                        <div className="editorial-label">Emisor</div>
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {getTicketActorName(currentReport.ticket?.emitter)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Fechas relevantes</h3>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Inicio tecnico</div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDateTime(currentReport.startedAt)}
                      </p>
                    </div>
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Fin tecnico</div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDateTime(currentReport.finishedAt)}
                      </p>
                    </div>
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Creado</div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDateTime(currentReport.createdAt)}
                      </p>
                    </div>
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Ultima actualizacion</div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDateTime(currentReport.updatedAt)}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Componentes registrados</h3>
                  </div>

                  <div className="mt-5">
                    {(currentReport.components ?? []).length > 0 ? (
                      <div className="space-y-3">
                        {currentReport.components?.map((component) => (
                          <div
                            key={`${currentReport.id}-${component.id ?? component.componentId}`}
                            className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">
                                  {component.component?.name ?? `Componente #${component.componentId}`}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {component.component?.description ?? 'Sin descripcion del componente'}
                                </p>
                              </div>
                              <Badge variant="outline">Cantidad: {component.quantity}</Badge>
                            </div>

                            <div className="mt-3 text-sm leading-6 text-muted-foreground">
                              {component.note?.trim() ? component.note : 'Sin observacion adicional.'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        Este reporte no registra componentes a reemplazar.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
