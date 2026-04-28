import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { FormEventHandler, RefCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { FieldErrors, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock3, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  return <p className="animate-in fade-in-0 slide-in-from-top-1 text-sm leading-6 text-destructive">{message}</p>;
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
    value === null ? undefined : options.find((option) => option.value === value)?.label;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <Select value={normalizedValue} onValueChange={(nextValue) => onChange(nextValue === '__none__' ? null : Number(nextValue))}>
        <SelectTrigger id={id} ref={registerRef} aria-invalid={Boolean(error)} className="w-full">
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allowEmptySelection ? <SelectItem value="__none__">{emptyLabel}</SelectItem> : null}
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                <span className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description ? <span className="text-xs text-muted-foreground">{option.description}</span> : null}
                </span>
              </SelectItem>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">No hay opciones disponibles.</div>
          )}
        </SelectContent>
      </Select>
      <FormFieldError message={error} />
    </div>
  );
}

export function TicketForm({
  variant = 'admin',
  mode: _mode = 'create',
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
  const isRequestVariant = variant === 'request';
  const activeSchema = isRequestVariant ? ticketRequestSchema : ticketAdminSchema;
  const mergedDefaults = useMemo(() => ({ ...defaultValues, ...initialValues }), [initialValues]);
  const visibleFieldOrder = useMemo(
    () => (isRequestVariant ? (['title', 'description', 'serviceId'] as Array<keyof TicketFormValues>) : fieldOrder),
    [isRequestVariant],
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

  const focusFirstError = useCallback(
    (formErrors: FieldErrors<TicketFormValues>) => {
      const firstErrorField = visibleFieldOrder.find((fieldName) => Boolean(formErrors[fieldName]));
      if (!firstErrorField) return;

      const target = fieldRefs.current[firstErrorField];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => target.focus({ preventScroll: true }), 120);
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

  const submitForm: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      void handleSubmit(onSubmit, onInvalid)(event);
    },
    [handleSubmit, onInvalid, onSubmit],
  );

  return (
    <Card className={cn('form-shell overflow-hidden rounded-(--radius-panel) border-0 bg-card/95', className)}>
      <CardContent className="relative z-10 px-5 py-0 sm:px-6 sm:py-0">
        <form className="space-y-5" onSubmit={submitForm} noValidate>
          <div className="space-y-2">
            <Label htmlFor="ticket-title" className="text-sm font-medium text-muted-foreground">
              Titulo
            </Label>
            <Input
              id="ticket-title"
              placeholder={isRequestVariant ? 'Ej. No puedo acceder al portal institucional' : 'Ej. Incidente reportado por mesa de ayuda'}
              aria-invalid={Boolean(errors.title)}
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
                  <Label htmlFor="ticket-status" className="text-sm font-medium text-muted-foreground">
                    Estado
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="ticket-status" ref={registerFieldRef('status')} aria-invalid={Boolean(fieldState.error)} className="w-full">
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

          <div className="space-y-2">
            <Label htmlFor="ticket-description" className="text-sm font-medium text-muted-foreground">
              Descripcion
            </Label>
            <Textarea
              id="ticket-description"
              placeholder={
                isRequestVariant
                  ? 'Describe el problema y el impacto que te genera.'
                  : 'Describe el problema, el contexto y cualquier detalle relevante para gestionarlo.'
              }
              aria-invalid={Boolean(errors.description)}
              className="min-h-24"
              {...descriptionField}
              ref={registerFieldRef('description', descriptionField.ref)}
            />
            <FormFieldError message={errors.description?.message} />
          </div>

          {!isRequestVariant ? (
            <div className="grid gap-5 md:grid-cols-2">
              <Controller
                control={control}
                name="priority"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="ticket-priority" className="text-sm font-medium text-muted-foreground">
                      Prioridad
                    </Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="ticket-priority" ref={registerFieldRef('priority')} aria-invalid={Boolean(fieldState.error)} className="w-full">
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
                <Label htmlFor="ticket-sla" className="text-sm font-medium text-muted-foreground">
                  SLA (minutos)
                </Label>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ticket-sla"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    placeholder="Ej. 120"
                    aria-invalid={Boolean(errors.slaMinutes)}
                    className="pl-10"
                    {...slaField}
                    ref={registerFieldRef('slaMinutes', slaField.ref)}
                  />
                </div>
                <FormFieldError message={errors.slaMinutes?.message} />
              </div>
            </div>
          ) : null}

          <div className={cn('grid gap-5', isRequestVariant ? 'md:grid-cols-1' : 'md:grid-cols-3')}>
            <Controller
              control={control}
              name="serviceId"
              render={({ field, fieldState }) => (
                <SelectField
                  id="ticket-serviceId"
                  label="Servicio"
                  placeholder="Selecciona un servicio"
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
            ) : null}

            {!isRequestVariant ? (
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
            ) : null}
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="min-w-44 justify-center">
                {cancelLabel}
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-56 justify-center px-6 text-sm font-semibold sm:min-w-64"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Guardando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {submitLabel ?? (isRequestVariant ? 'Enviar solicitud' : 'Guardar ticket')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
