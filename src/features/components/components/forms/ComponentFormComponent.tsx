import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { componentFormSchema, type ComponentFormValues } from '@/features/components/schemas';

type ComponentFormComponentProps = {
  initialValues: ComponentFormValues;
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  onSubmit: (values: ComponentFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function ComponentFormComponent({
  initialValues,
  mode,
  isSubmitting,
  onSubmit,
  onCancel,
}: ComponentFormComponentProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ComponentFormValues>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: initialValues,
  });

  const isActive = watch('isActive');

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nuevo componente' : 'Editar componente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onFormSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="component-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="component-name"
                placeholder="Ej. SSD 1TB"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="component-active" className="flex items-center gap-2 pt-8">
                <Checkbox
                  id="component-active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('isActive', !!checked)}
                />
                Activo
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="component-description">Descripción</Label>
            <textarea
              id="component-description"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ej. Disco sólido para reemplazo"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
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
