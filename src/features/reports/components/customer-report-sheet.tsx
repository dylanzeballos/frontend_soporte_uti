import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PackagePlus,
  UserRound,
  Wrench,
  XIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useReports } from '@/hooks/useApi';

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

interface CustomerReportSheetProps {
  open: boolean;
  ticketId: number | null;
  ticketTitle?: string;
  onOpenChange: (open: boolean) => void;
}

export function CustomerReportSheet({
  open,
  ticketId,
  ticketTitle,
  onOpenChange,
}: CustomerReportSheetProps) {
  const { findCustomerSummaryByTicketId } = useReports();

  const { data: report = null, isLoading } = useQuery({
    queryKey: ['customer-ticket-report', ticketId ?? 0],
    enabled: open && Boolean(ticketId),
    queryFn: () =>
      ticketId ? findCustomerSummaryByTicketId(ticketId) : Promise.resolve(null),
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[min(90vh,820px)] w-[min(760px,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border/60 bg-background shadow-[var(--shadow-3)] transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon-sm" className="absolute right-4 top-4 z-10" />}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Cerrar detalle</span>
          </DialogPrimitive.Close>

          <div className="border-b bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_40%),var(--card)] px-5 py-5 sm:px-7">
            <div className="space-y-3 pr-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <ClipboardList className="h-3.5 w-3.5" />
                Resumen del trabajo realizado
              </div>
              <DialogPrimitive.Title className="text-xl font-semibold leading-7 text-foreground">
                {ticketTitle ?? (ticketId ? `Ticket #${ticketId}` : 'Reporte del ticket')}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Aqui puedes ver un resumen de la atencion realizada sobre tu solicitud.
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                Cargando reporte...
              </div>
            ) : !report ? (
              <div className="rounded-2xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                Aun no hay un reporte disponible para este ticket.
              </div>
            ) : (
              <>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Reporte
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">#{report.id}</div>
                  </div>
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5" />
                      Tecnico
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {report.technician?.name ?? 'No registrado'}
                    </div>
                  </div>
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <Wrench className="h-3.5 w-3.5" />
                      Tipo de solucion
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {report.resolutionType ?? 'No especificado'}
                    </div>
                  </div>
                  <div className="editorial-inset rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Actualizado
                    </div>
                    <div className="mt-2 text-base font-semibold text-foreground">
                      {formatDateTime(report.updatedAt)}
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Lo que se realizo</h3>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Resumen</div>
                      <p className="mt-2 text-sm leading-6 text-foreground">{report.summary}</p>
                    </div>
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Detalle de la atencion</div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {report.workPerformed}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Fechas de atencion</h3>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Inicio</div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDateTime(report.startedAt)}
                      </p>
                    </div>
                    <div className="editorial-inset rounded-2xl p-4">
                      <div className="editorial-label">Finalizacion</div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDateTime(report.finishedAt)}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="form-panel p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Componentes reemplazados</h3>
                  </div>

                  <div className="mt-5">
                    {report.components.length > 0 ? (
                      <div className="space-y-3">
                        {report.components.map((component) => (
                          <div
                            key={`${report.id}-${component.id ?? component.componentId}`}
                            className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="font-medium text-foreground">{component.name}</p>
                              <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                Cantidad: {component.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        Este reporte no registra cambios de componentes.
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
