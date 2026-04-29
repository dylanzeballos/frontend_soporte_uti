import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  PackagePlus,
  Plus,
  ShieldAlert,
  Trash2,
  Wrench,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/features/tickets/schemas/ticket.schema';
import { useComponents, useReports, useTickets } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import {
  reportFormSchema,
  type ComponentCatalogItem,
  type Report,
  type ReportFormValues,
} from '@/features/reports/schemas';

type SubmitIntent = 'save' | 'resolve';

interface TicketReportSheetProps {
  open: boolean;
  ticket: Ticket | null;
  canWrite: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: (ticket: Ticket) => void;
}

const resolutionSuggestions = ['hardware', 'software', 'network', 'maintenance', 'other'] as const;

const emptyValues: ReportFormValues = {
  summary: '',
  workPerformed: '',
  resolutionType: '',
  startedAt: '',
  finishedAt: '',
  components: [],
};

function getAssigneeName(ticket: Ticket): string {
  if (!ticket.assignedTo) return 'Sin asignar';
  const fullName = [ticket.assignedTo.firstName, ticket.assignedTo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || ticket.assignedTo.name || ticket.assignedTo.email;
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormValues(report: Report | null | undefined): ReportFormValues {
  if (!report) {
    return emptyValues;
  }

  return {
    summary: report.summary ?? '',
    workPerformed: report.workPerformed ?? '',
    resolutionType: report.resolutionType ?? '',
    startedAt: formatDateTimeLocal(report.startedAt),
    finishedAt: formatDateTimeLocal(report.finishedAt),
    components: (report.components ?? []).map((component) => ({
      componentId: component.componentId,
      quantity: component.quantity,
      note: component.note ?? '',
    })),
  };
}

function buildPayload(ticketId: number, values: ReportFormValues) {
  return {
    ticketId,
    summary: values.summary.trim(),
    workPerformed: values.workPerformed.trim(),
    resolutionType: values.resolutionType.trim(),
    ...(values.startedAt ? { startedAt: new Date(values.startedAt).toISOString() } : {}),
    ...(values.finishedAt ? { finishedAt: new Date(values.finishedAt).toISOString() } : {}),
    components: values.components.map((component) => ({
      componentId: Number(component.componentId),
      quantity: Number(component.quantity),
      ...(component.note?.trim() ? { note: component.note.trim() } : {}),
    })),
  };
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-xs leading-5 text-destructive">{message}</p>;
}

export function TicketReportSheet({
  open,
  ticket,
  canWrite,
  onOpenChange,
  onTicketUpdated,
}: TicketReportSheetProps) {
  const queryClient = useQueryClient();
  const { list: listComponents } = useComponents();
  const { findByTicketId, create, update } = useReports();
  const { updateStatus } = useTickets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent>('save');

  const { data: componentCatalog = [], isLoading: componentsLoading } = useQuery<ComponentCatalogItem[]>({
    queryKey: ['component-catalog', 'active'],
    enabled: open,
    queryFn: () => listComponents({ page: 1, limit: 100, isActive: true }),
  });

  const reportQueryKey = useMemo(
    () => ['ticket-report', ticket?.id ?? 0] as const,
    [ticket?.id],
  );

  const {
    data: existingReport = null,
    isLoading: reportLoading,
    refetch: refetchReport,
  } = useQuery<Report | null>({
    queryKey: reportQueryKey,
    enabled: open && Boolean(ticket?.id),
    queryFn: () => (ticket?.id ? findByTicketId(ticket.id) : Promise.resolve(null)),
  });

  const initialValues = useMemo(() => toFormValues(existingReport), [existingReport]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const canResolve = ticket?.status !== 'resolved' && ticket?.status !== 'closed';
  const isBusy = isSubmitting || reportLoading;
  const hasComponents = componentCatalog.length > 0;

  const submitReport = handleSubmit(async (values) => {
    if (!ticket || !canWrite) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload(ticket.id, values);
      const savedReport = existingReport?.id
        ? await update(existingReport.id, payload)
        : await create(payload);

      queryClient.setQueryData(reportQueryKey, savedReport);
      void queryClient.invalidateQueries({ queryKey: ['reports'] });

      if (submitIntent === 'resolve' && canResolve) {
        try {
          const updatedTicket = await updateStatus(ticket.id, {
            status: 'resolved',
            comment: 'Reporte tecnico registrado desde el tablero Kanban',
          });

          syncUpdatedTicketCaches(queryClient, updatedTicket);
          invalidateTicketCaches(queryClient);
          onTicketUpdated?.(updatedTicket);
        } catch {
          toast.info('El reporte se guardo, pero el ticket sigue sin resolverse.');
          return;
        }
      }

      toast.success(
        submitIntent === 'resolve' && canResolve
          ? 'Reporte guardado y ticket resuelto'
          : existingReport?.id
            ? 'Reporte actualizado'
            : 'Reporte guardado',
      );

      onOpenChange(false);
    } catch {
      if (!existingReport?.id && ticket?.id) {
        const recoveredReport = await findByTicketId(ticket.id);
        if (recoveredReport) {
          queryClient.setQueryData(reportQueryKey, recoveredReport);
          reset(toFormValues(recoveredReport));
          toast.info('Ya existia un reporte para este ticket. Cargamos la version actual.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 flex h-[min(92vh,980px)] w-[min(960px,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border/60 bg-background shadow-[var(--shadow-3)] transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon-sm" className="absolute right-4 top-4 z-10" />}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Cerrar reporte</span>
          </DialogPrimitive.Close>

          <div className="border-b bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_40%),var(--card)] px-5 py-5 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Reporte tecnico
                </div>
                <DialogPrimitive.Title className="text-xl font-semibold leading-7 text-foreground">
                  {ticket ? ticket.title : 'Selecciona un ticket'}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Registra la atencion realizada y las piezas que deben reemplazarse. Si ya terminaste, puedes resolver el ticket desde este mismo formulario.
                </DialogPrimitive.Description>
              </div>

              {ticket ? (
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn('border', getStatusColor(ticket.status))}>
                    {getStatusLabel(ticket.status)}
                  </Badge>
                  <Badge className={cn('border', getPriorityColor(ticket.priority))}>
                    {getPriorityLabel(ticket.priority)}
                  </Badge>
                  {existingReport?.id ? <Badge variant="secondary">Reporte existente</Badge> : null}
                </div>
              ) : null}
            </div>

            {ticket ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-background/80 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Ticket
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">#{ticket.id}</div>
                </div>
                <div className="rounded-2xl border bg-background/80 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Asignado
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {getAssigneeName(ticket)}
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/80 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Servicio
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {ticket.service?.name ?? 'No definido'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {!ticket ? (
            <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground">
              Selecciona un ticket para continuar.
            </div>
          ) : reportLoading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Cargando reporte...
            </div>
          ) : (
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitReport} noValidate>
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                <div className="space-y-5">
                  {!canWrite ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p className="leading-6 text-amber-900 dark:text-amber-200">
                        Solo el tecnico responsable puede registrar o editar este reporte.
                      </p>
                    </div>
                  ) : null}

                  <section className="form-panel p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Resultado</h3>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-summary" className="text-sm font-medium text-muted-foreground">
                          Resumen
                        </Label>
                        <Input
                          id="report-summary"
                          placeholder="Ej. Cambio de SSD y pruebas finales correctas"
                          disabled={!canWrite || isBusy}
                          aria-invalid={Boolean(errors.summary)}
                          {...register('summary')}
                        />
                        <FormError message={errors.summary?.message} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="report-workPerformed" className="text-sm font-medium text-muted-foreground">
                          Trabajo realizado
                        </Label>
                        <Textarea
                          id="report-workPerformed"
                          placeholder="Describe el diagnostico y lo que hiciste para resolver o atender el caso."
                          className="min-h-28"
                          disabled={!canWrite || isBusy}
                          aria-invalid={Boolean(errors.workPerformed)}
                          {...register('workPerformed')}
                        />
                        <FormError message={errors.workPerformed?.message} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="report-resolutionType" className="text-sm font-medium text-muted-foreground">
                          Tipo de solucion
                        </Label>
                        <Input
                          id="report-resolutionType"
                          list="report-resolution-type-options"
                          placeholder="Ej. hardware"
                          disabled={!canWrite || isBusy}
                          aria-invalid={Boolean(errors.resolutionType)}
                          {...register('resolutionType')}
                        />
                        <datalist id="report-resolution-type-options">
                          {resolutionSuggestions.map((option) => (
                            <option key={option} value={option} />
                          ))}
                        </datalist>
                        <FormError message={errors.resolutionType?.message} />
                      </div>
                    </div>
                  </section>

                  <section className="form-panel p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Tiempo</h3>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="report-startedAt" className="text-sm font-medium text-muted-foreground">
                          Inicio
                        </Label>
                        <Input
                          id="report-startedAt"
                          type="datetime-local"
                          disabled={!canWrite || isBusy}
                          aria-invalid={Boolean(errors.startedAt)}
                          {...register('startedAt')}
                        />
                        <FormError message={errors.startedAt?.message} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="report-finishedAt" className="text-sm font-medium text-muted-foreground">
                          Fin
                        </Label>
                        <Input
                          id="report-finishedAt"
                          type="datetime-local"
                          disabled={!canWrite || isBusy}
                          aria-invalid={Boolean(errors.finishedAt)}
                          {...register('finishedAt')}
                        />
                        <FormError message={errors.finishedAt?.message} />
                      </div>
                    </div>
                  </section>

                  <section className="form-panel p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <PackagePlus className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold">Componentes a reemplazar</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Registra aqui solo las piezas que deben cambiarse en la atencion.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canWrite || isBusy || !hasComponents}
                        onClick={() =>
                          append({
                            componentId: 0,
                            quantity: 1,
                            note: '',
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar componente
                      </Button>
                    </div>

                    <div className="mt-5">
                      {componentsLoading ? (
                        <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                          Cargando catalogo de componentes...
                        </div>
                      ) : fields.length > 0 ? (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4"
                            >
                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_9rem_auto]">
                                <Controller
                                  control={control}
                                  name={`components.${index}.componentId`}
                                  render={({ field: componentField }) => {
                                    const selectedComponent =
                                      componentCatalog.find((component) => component.id === componentField.value) ?? null;

                                    return (
                                      <div className="min-w-0 space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">
                                          Componente
                                        </Label>
                                        <Select
                                          value={componentField.value > 0 ? String(componentField.value) : undefined}
                                          onValueChange={(value) => componentField.onChange(Number(value))}
                                          disabled={!canWrite || isBusy}
                                        >
                                          <SelectTrigger
                                            className="w-full min-w-0"
                                            aria-invalid={Boolean(errors.components?.[index]?.componentId)}
                                          >
                                            <SelectValue placeholder="Selecciona un componente" />
                                          </SelectTrigger>
                                          <SelectContent
                                            align="start"
                                            alignItemWithTrigger={false}
                                            className="min-w-[18rem] sm:min-w-[26rem]"
                                          >
                                            {componentCatalog.map((component) => (
                                              <SelectItem key={component.id} value={String(component.id)}>
                                                {component.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <p className="text-xs leading-5 text-muted-foreground">
                                          {selectedComponent?.description ?? 'Selecciona la pieza que se debe reemplazar.'}
                                        </p>
                                        <FormError message={errors.components?.[index]?.componentId?.message} />
                                      </div>
                                    );
                                  }}
                                />

                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`report-component-quantity-${index}`}
                                    className="text-sm font-medium text-muted-foreground"
                                  >
                                    Cantidad
                                  </Label>
                                  <Input
                                    id={`report-component-quantity-${index}`}
                                    type="number"
                                    min={1}
                                    step={1}
                                    inputMode="numeric"
                                    disabled={!canWrite || isBusy}
                                    aria-invalid={Boolean(errors.components?.[index]?.quantity)}
                                    {...register(`components.${index}.quantity`, {
                                      valueAsNumber: true,
                                    })}
                                  />
                                  <FormError message={errors.components?.[index]?.quantity?.message} />
                                </div>

                                <div className="flex items-start justify-end xl:pt-7">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Eliminar componente ${index + 1}`}
                                    disabled={!canWrite || isBusy}
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <Label
                                  htmlFor={`report-component-note-${index}`}
                                  className="text-sm font-medium text-muted-foreground"
                                >
                                  Detalle
                                </Label>
                                <Input
                                  id={`report-component-note-${index}`}
                                  placeholder="Ej. desgaste del componente o motivo del cambio"
                                  disabled={!canWrite || isBusy}
                                  aria-invalid={Boolean(errors.components?.[index]?.note)}
                                  {...register(`components.${index}.note`)}
                                />
                                <FormError message={errors.components?.[index]?.note?.message} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                          {hasComponents
                            ? 'Agrega solo las piezas que necesiten reemplazo en este ticket.'
                            : 'Aun no hay componentes cargados por administracion.'}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="border-t bg-background/95 px-5 py-4 sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {existingReport?.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => {
                        void refetchReport();
                      }}
                    >
                      Recargar
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canWrite || isBusy}
                    onClick={() => onOpenChange(false)}
                  >
                    Cerrar
                  </Button>

                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!canWrite || isBusy}
                    onClick={() => setSubmitIntent('save')}
                  >
                    {isSubmitting && submitIntent === 'save' ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Wrench className="mr-2 h-4 w-4" />
                        {existingReport?.id ? 'Actualizar reporte' : 'Guardar reporte'}
                      </>
                    )}
                  </Button>

                  <Button
                    type="submit"
                    disabled={!canWrite || isBusy}
                    onClick={() => setSubmitIntent('resolve')}
                  >
                    {isSubmitting && submitIntent === 'resolve' ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {canResolve ? 'Guardar y resolver' : 'Guardar cambios'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
