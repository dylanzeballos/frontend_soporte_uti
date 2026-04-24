import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { RefCallback } from 'react';
import type { FormEventHandler } from 'react';
import type { FieldErrors, SubmitErrorHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock3, Layers3, Send, ShieldAlert, UserRoundCheck, UserRoundPen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ticketAdminSchema,
  ticketPriorityOptions,
  ticketRequestSchema,
  ticketStatusOptions,
  type TicketFormValues,
} from '@/features/tickets/schemas/ticket.schema';

export interface TicketSelectOption {
  value: number;
  label: string;
  description?: string;
}

interface TicketFormProps {
  variant?: 'request' | 'admin';
  mode?: 'create' | 'edit';
  initialValues?: Partial<TicketFormValues>;
  assigneeOptions?: TicketSelectOption[];
  emitterOptions?: TicketSelectOption[];
  serviceOptions?: TicketSelectOption[];
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const fieldOrder: Array<keyof TicketFormValues> = [
  'title',
  'description',
  'status',
  'priority',
  'assignedToId',
  'emitterId',
  'serviceId',
  'slaMinutes',
];

const defaultValues: TicketFormValues = {
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  assignedToId: null,
  emitterId: null,
  serviceId: null,
  slaMinutes: null,
};

function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="animate-in fade-in slide-in-from-top-1 text-sm text-destructive duration-200">
      {message}
    </p>
  );
}

function FormSectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  placeholder,
  error,
  value,
  options,
  onChange,
  registerRef,
  emptyLabel,
  allowEmptySelection = true,
}: {
  id: string;
  label: string;
  placeholder: string;
  error?: string;
  value: number | null;
  options: TicketSelectOption[];
  onChange: (value: number | null) => void;
  registerRef: RefCallback<HTMLButtonElement>;
  emptyLabel: string;
  allowEmptySelection?: boolean;
}) {
  const normalizedValue = value === null ? undefined : String(value);
  const selectedLabel =
    value === null
      ? undefined
      : options.find((option) => option.value === value)?.label;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={normalizedValue}
        onValueChange={(nextValue) => onChange(nextValue === '__none__' ? null : Number(nextValue))}
      >
        <SelectTrigger
          id={id}
          ref={registerRef}
          aria-invalid={Boolean(error)}
          className="w-full bg-card transition-all duration-200 hover:border-primary/35 hover:bg-primary/5"
        >
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allowEmptySelection ? <SelectItem value="__none__">{emptyLabel}</SelectItem> : null}
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description ? (
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  ) : null}
                </span>
              </SelectItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No hay opciones disponibles todavia.</div>
          )}
        </SelectContent>
      </Select>
      <FormFieldError message={error} />
    </div>
  );
}

export function TicketForm({
  variant = 'admin',
  mode = 'create',
  initialValues,
  assigneeOptions = [],
  emitterOptions = [],
  serviceOptions = [],
  isSubmitting = false,
  submitLabel,
  cancelLabel = 'Cancelar',
  className,
  onSubmit,
  onCancel,
}: TicketFormProps) {
  const activeSchema = variant === 'request' ? ticketRequestSchema : ticketAdminSchema;

  const mergedDefaults = useMemo(
    () => ({
      ...defaultValues,
      ...initialValues,
    }),
    [initialValues],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(activeSchema),
    defaultValues: mergedDefaults,
  });

  const fieldRefs = useRef<Partial<Record<keyof TicketFormValues, HTMLElement | null>>>({});

  useEffect(() => {
    reset(mergedDefaults);
  }, [mergedDefaults, reset]);

  const registerFieldRef = useCallback(
    (name: keyof TicketFormValues, fieldRef?: (instance: unknown) => void) =>
      (node: HTMLElement | null) => {
        fieldRefs.current[name] = node;
        fieldRef?.(node);
      },
    [],
  );

  const isRequestVariant = variant === 'request';
  const visibleFieldOrder = useMemo(
    () =>
      isRequestVariant
        ? (['title', 'description', 'serviceId'] as Array<keyof TicketFormValues>)
        : fieldOrder,
    [isRequestVariant],
  );

  const focusFirstError = useCallback(
    (formErrors: FieldErrors<TicketFormValues>) => {
      const firstErrorField = visibleFieldOrder.find((fieldName) => Boolean(formErrors[fieldName]));
      if (!firstErrorField) return;

      const target = fieldRefs.current[firstErrorField];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
          target.focus({ preventScroll: true });
        }, 120);
        return;
      }

      void setFocus(firstErrorField);
    },
    [setFocus, visibleFieldOrder],
  );

  const titleField = register('title');
  const descriptionField = register('description');
  const slaField = register('slaMinutes', {
    setValueAs: (value) => {
      if (value === '' || value === null || typeof value === 'undefined') return null;
      return Number(value);
    },
  });

  const onInvalid: SubmitErrorHandler<TicketFormValues> = useCallback(
    (formErrors) => {
      focusFirstError(formErrors);
    },
    [focusFirstError],
  );

  const formTitle = isRequestVariant
    ? 'Solicitar ticket'
    : mode === 'edit'
      ? 'Editar ticket'
      : 'Recepcion de ticket';
  const formDescription = isRequestVariant
    ? 'Usa este formulario cuando un usuario necesita registrar una solicitud de soporte para que el equipo la reciba.'
    : mode === 'edit'
      ? 'Actualiza la informacion operativa del ticket sin perder consistencia con el esquema de Prisma.'
      : 'Usa este formulario cuando el area administrativa recibe un ticket y necesita clasificarlo, priorizarlo y asignarlo.';

  const submitForm: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      void handleSubmit(onSubmit, onInvalid)(event);
    },
    [handleSubmit, onInvalid, onSubmit],
  );

  return (
    <Card
      className={cn(
        'overflow-hidden border border-primary/10 bg-[linear-gradient(180deg,rgba(128,0,28,0.05),transparent_28%),var(--card)] shadow-sm',
        className,
      )}
    >
      <CardHeader className="border-b border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(128,0,28,0.12),transparent_42%)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold tracking-tight">{formTitle}</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">{formDescription}</CardDescription>
          </div>
          <div className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            {isRequestVariant ? 'Solicitud' : mode === 'edit' ? 'Modo edicion' : 'Recepcion admin'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        <form className="space-y-8" onSubmit={submitForm} noValidate>
          <section className="space-y-5">
            <FormSectionHeader
              icon={Layers3}
              title="Contexto del ticket"
              description="Completa la informacion principal con una jerarquia clara para lectura rapida del equipo de soporte."
            />

            <div className={cn('grid gap-5', isRequestVariant ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.4fr_0.6fr]')}>
              <div className="space-y-2">
                <Label htmlFor="ticket-title">Titulo</Label>
                <Input
                  id="ticket-title"
                  placeholder={
                    isRequestVariant
                      ? 'Ej. No puedo acceder al portal institucional'
                      : 'Ej. Incidente reportado por mesa de ayuda'
                  }
                  aria-invalid={Boolean(errors.title)}
                  className="bg-card transition-all duration-200 hover:border-primary/35 hover:bg-primary/5"
                  {...titleField}
                  ref={registerFieldRef('title', titleField.ref)}
                />
                <FormFieldError message={errors.title?.message} />
              </div>

              {!isRequestVariant ? (
                <Controller
                  control={control}
                  name="status"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="ticket-status">Estado</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="ticket-status"
                        ref={registerFieldRef('status')}
                        aria-invalid={Boolean(fieldState.error)}
                        className="w-full bg-card transition-all duration-200 hover:border-primary/35 hover:bg-primary/5"
                      >
                        <SelectValue placeholder="Selecciona un estado">
                          {ticketStatusOptions.find((option) => option.value === field.value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                        <SelectContent>
                          {ticketStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormFieldError message={fieldState.error?.message} />
                    </div>
                  )}
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="ticket-description">Descripcion</Label>
                <span className="text-xs text-muted-foreground">
                  {isRequestVariant
                    ? 'Describe el problema, cuando ocurre y como impacta tu trabajo.'
                    : 'Incluye sintomas, contexto y resultado esperado.'}
                </span>
              </div>
              <Textarea
                id="ticket-description"
                placeholder={
                  isRequestVariant
                    ? 'Describe el problema, el mensaje de error y cualquier evidencia util para soporte.'
                    : 'Describe el problema, impacto y cualquier detalle tecnico relevante.'
                }
                aria-invalid={Boolean(errors.description)}
                className="min-h-36 bg-card transition-all duration-200 hover:border-primary/35 hover:bg-primary/5"
                {...descriptionField}
                ref={registerFieldRef('description', descriptionField.ref)}
              />
              <FormFieldError message={errors.description?.message} />
            </div>
          </section>

          {!isRequestVariant ? (
            <section className="space-y-5">
              <FormSectionHeader
                icon={ShieldAlert}
                title="Prioridad y SLA"
                description="Define la urgencia operativa y el tiempo objetivo de atencion para facilitar la toma de decisiones."
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Controller
                  control={control}
                  name="priority"
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="ticket-priority">Prioridad</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="ticket-priority"
                          ref={registerFieldRef('priority')}
                          aria-invalid={Boolean(fieldState.error)}
                          className="w-full bg-card transition-all duration-200 hover:border-primary/35 hover:bg-primary/5"
                        >
                          <SelectValue placeholder="Selecciona una prioridad">
                            {ticketPriorityOptions.find((option) => option.value === field.value)?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ticketPriorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormFieldError message={fieldState.error?.message} />
                    </div>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="ticket-sla">SLA (minutos)</Label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ticket-sla"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      placeholder="Ej. 120"
                      aria-invalid={Boolean(errors.slaMinutes)}
                      className="bg-card pl-9 transition-all duration-200 hover:border-primary/35 hover:bg-primary/5"
                      {...slaField}
                      ref={registerFieldRef('slaMinutes', slaField.ref)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Deja este campo vacio si el ticket no tiene un SLA definido.</p>
                  <FormFieldError message={errors.slaMinutes?.message} />
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-5">
            <FormSectionHeader
              icon={UserRoundPen}
              title={isRequestVariant ? 'Servicio solicitado' : 'Relacionamiento'}
              description={
                isRequestVariant
                  ? 'Selecciona el servicio sobre el que necesitas ayuda para que el ticket llegue mejor encaminado.'
                  : 'Asocia responsables y origen del requerimiento para mejorar trazabilidad y reportes.'
              }
            />

            <div className={cn('grid gap-5', isRequestVariant ? 'lg:grid-cols-1' : 'lg:grid-cols-3')}>
              <Controller
                control={control}
                name="serviceId"
                render={({ field, fieldState }) => (
                  <SelectField
                    id="ticket-serviceId"
                    label={isRequestVariant ? 'Servicio requerido' : 'Servicio'}
                    placeholder={isRequestVariant ? 'Selecciona el servicio que necesitas' : 'Selecciona un servicio'}
                    error={fieldState.error?.message}
                    value={field.value}
                        options={serviceOptions}
                        onChange={field.onChange}
                        registerRef={registerFieldRef('serviceId')}
                        emptyLabel="Sin servicio"
                        allowEmptySelection={!isRequestVariant}
                      />
                    )}
                  />

              {!isRequestVariant ? (
                <>
                  <Controller
                    control={control}
                    name="assignedToId"
                    render={({ field, fieldState }) => (
                      <SelectField
                        id="ticket-assignedToId"
                        label="Asignado a"
                        placeholder="Selecciona un agente"
                        error={fieldState.error?.message}
                        value={field.value}
                        options={assigneeOptions}
                        onChange={field.onChange}
                        registerRef={registerFieldRef('assignedToId')}
                        emptyLabel="Sin asignar"
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="emitterId"
                    render={({ field, fieldState }) => (
                      <SelectField
                        id="ticket-emitterId"
                        label="Emisor"
                        placeholder="Selecciona el usuario emisor"
                        error={fieldState.error?.message}
                        value={field.value}
                        options={emitterOptions}
                        onChange={field.onChange}
                        registerRef={registerFieldRef('emitterId')}
                        emptyLabel="Sin emisor"
                      />
                    )}
                  />
                </>
              ) : null}
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-primary/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRoundCheck className="h-4 w-4 text-primary" />
              <span>
                Los mensajes de validacion se muestran debajo de cada campo y el foco salta al primero con error.
                {isRequestVariant ? ' Los campos internos quedan reservados para la gestion administrativa.' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {onCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {cancelLabel}
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-44 transition-transform duration-200 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {submitLabel ?? (isRequestVariant ? 'Enviar solicitud' : mode === 'edit' ? 'Guardar cambios' : 'Crear ticket')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
