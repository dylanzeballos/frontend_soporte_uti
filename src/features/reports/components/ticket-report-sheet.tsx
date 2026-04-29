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
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { invalidateTicketCaches, syncUpdatedTicketCaches } from '@/features/tickets/lib/ticket-cache';
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
      componentId: component.componentId,
      quantity: Number(component.quantity),
      ...(component.note?.trim() ? { note: component.note.trim() } : {}),
    })),
  };
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-xs leading-5 text-destructive">{message}</p>;
}

function ComponentOptionLabel({ component }: { component: ComponentCatalogItem }) {
  return (
    <span className="flex flex-col">
      <span>{component.name}</span>
      {component.description ? (
        <span className="text-xs text-muted-foreground">{component.description}</span>
      ) : null}
    </span>
  );
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

  const initialValues = useMemo(
    () => toFormValues(existingReport),
    [existingReport],
  );

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

  const isBusy = isSubmitting || reportLoading;
  const hasComponents = componentCatalog.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-l bg-background p-0 sm:max-w-2xl"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b bg-gradient-to-br from-sky-500/10 via-background to-emerald-500/10 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Reporte tecnico
                </div>
                <SheetTitle className="text-xl leading-7">
                  {ticket ? ticket.title : 'Selecciona un ticket'}
                </SheetTitle>
                <SheetDescription className="max-w-xl text-sm leading-6">
                  Registra el trabajo realizado y, si corresponde, cierra el ticket desde aqui.
                </SheetDescription>
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
          </SheetHeader>

          {!ticket ? (
            <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground">
              Selecciona un ticket para continuar.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {reportLoading ? (
                <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                  Cargando reporte...
                </div>
              ) : (
                <form className="space-y-5" onSubmit={submitReport} noValidate>
                  {!canWrite ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p className="leading-6 text-amber-900 dark:text-amber-200">
                        Solo el tecnico responsable puede registrar o editar este reporte.
                      </p>
                    </div>
                  ) : null}

                  <section className="space-y-4 rounded-[var(--radius-panel)] border bg-card/60 p-5">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Resultado</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-summary">Resumen</Label>
                      <Input
                        id="report-summary"
                        placeholder="Ej. Reemplazo de unidad y verificacion final"
                        disabled={!canWrite || isBusy}
                        aria-invalid={Boolean(errors.summary)}
                        {...register('summary')}
                      />
                      <FormError message={errors.summary?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-workPerformed">Trabajo realizado</Label>
                      <Textarea
                        id="report-workPerformed"
                        placeholder="Describe en pocas lineas el diagnostico y las acciones ejecutadas."
                        className="min-h-32"
                        disabled={!canWrite || isBusy}
                        aria-invalid={Boolean(errors.workPerformed)}
                        {...register('workPerformed')}
                      />
                      <FormError message={errors.workPerformed?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-resolutionType">Tipo de solucion</Label>
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
                  </section>

                  <section className="space-y-4 rounded-[var(--radius-panel)] border bg-card/60 p-5">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Tiempo</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="report-startedAt">Inicio</Label>
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
                        <Label htmlFor="report-finishedAt">Fin</Label>
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

                  <section className="space-y-4 rounded-[var(--radius-panel)] border bg-card/60 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <PackagePlus className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Componentes usados</h3>
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
                        Agregar
                      </Button>
                    </div>

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
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_8rem_auto]">
                              <Controller
                                control={control}
                                name={`components.${index}.componentId`}
                                render={({ field: componentField }) => (
                                  <div className="space-y-2">
                                    <Label>Componente</Label>
                                    <Select
                                      value={
                                        componentField.value > 0
                                          ? String(componentField.value)
                                          : undefined
                                      }
                                      onValueChange={(value) =>
                                        componentField.onChange(Number(value))
                                      }
                                      disabled={!canWrite || isBusy}
                                    >
                                      <SelectTrigger aria-invalid={Boolean(errors.components?.[index]?.componentId)}>
                                        <SelectValue placeholder="Selecciona un componente" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {componentCatalog.map((component) => (
                                          <SelectItem key={component.id} value={String(component.id)}>
                                            <ComponentOptionLabel component={component} />
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormError message={errors.components?.[index]?.componentId?.message} />
                                  </div>
                                )}
                              />

                              <div className="space-y-2">
                                <Label htmlFor={`report-component-quantity-${index}`}>Cantidad</Label>
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

                              <div className="flex items-end">
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
                              <Label htmlFor={`report-component-note-${index}`}>Nota</Label>
                              <Input
                                id={`report-component-note-${index}`}
                                placeholder="Opcional"
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
                          ? 'Agrega solo los componentes que realmente usaste.'
                          : 'Aun no hay componentes cargados por administracion.'}
                      </div>
                    )}
                  </section>

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
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
                </form>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
