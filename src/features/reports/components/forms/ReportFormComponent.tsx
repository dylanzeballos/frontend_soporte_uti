import { useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reportFormSchema, resolutionTypeOptions, type ReportFormValues } from '@/features/reports/schemas';
import type { Component } from '@/features/components/schemas';

type ReportFormComponentProps = {
  initialValues: ReportFormValues;
  mode: 'create' | 'edit';
  availableComponents: Component[];
  isSubmitting: boolean;
  onSubmit: (values: ReportFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function ReportFormComponent({
  initialValues,
  mode,
  availableComponents,
  isSubmitting,
  onSubmit,
  onCancel,
}: ReportFormComponentProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema) as Resolver<ReportFormValues>,
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const resolutionType = useWatch({ control, name: 'resolutionType' });
  const selectedComponents = useWatch({ control, name: 'components' }) ?? [];

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const addComponent = () => {
    append({ componentId: 0, quantity: 1, note: '' });
  };

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nuevo reporte' : 'Editar reporte'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onFormSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-ticket">
                ID Ticket <span className="text-destructive">*</span>
              </Label>
              <Input
                id="report-ticket"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 15"
                {...register('ticketId')}
                aria-invalid={errors.ticketId ? 'true' : 'false'}
              />
              {errors.ticketId && (
                <p className="text-sm text-destructive">{errors.ticketId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de resolución</Label>
              <Select
                value={resolutionType || ''}
                onValueChange={(v) => setValue('resolutionType', v || null)}
              >
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {resolutionTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-summary">
              Resumen <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-summary"
              placeholder="Ej. Falla de almacenamiento en estación de trabajo"
              {...register('summary')}
              aria-invalid={errors.summary ? 'true' : 'false'}
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-work">Trabajo realizado</Label>
            <textarea
              id="report-work"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe el trabajo realizado..."
              rows={3}
              {...register('workPerformed')}
            />
            {errors.workPerformed && (
              <p className="text-sm text-destructive">{errors.workPerformed.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-started">Inicio</Label>
              <Input
                id="report-started"
                type="datetime-local"
                {...register('startedAt')}
              />
              {errors.startedAt && (
                <p className="text-sm text-destructive">{errors.startedAt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-finished">Fin</Label>
              <Input
                id="report-finished"
                type="datetime-local"
                {...register('finishedAt')}
              />
              {errors.finishedAt && (
                <p className="text-sm text-destructive">{errors.finishedAt.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Componentes utilizados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addComponent}
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>

            {fields.length > 0 && (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 rounded-md bg-background/50 p-3">
                    <Select
                      value={selectedComponents[idx]?.componentId?.toString() || ''}
                      onValueChange={(v) =>
                        setValue(`components.${idx}.componentId`, Number(v))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar componente" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableComponents.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="1"
                      {...register(`components.${idx}.quantity`, { valueAsNumber: true })}
                      placeholder="Cantidad"
                      className="w-20"
                    />

                    <Input
                      {...register(`components.${idx}.note`)}
                      placeholder="Nota"
                      className="flex-1"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(idx)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
