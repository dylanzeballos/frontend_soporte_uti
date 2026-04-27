import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { staticServices } from '@/features/services/data/static-services';
import { createServiceSchema, type CreateServiceInput } from '@/features/services/schemas';

export function ServiceCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const isEditMode = Number.isInteger(serviceId) && serviceId > 0;
  const selectedService = isEditMode
    ? staticServices.find((service) => service.id === serviceId) ?? null
    : null;

  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (isEditMode && selectedService) {
      reset({ name: selectedService.name });
      return;
    }

    reset({ name: '' });
  }, [isEditMode, reset, selectedService]);

  const onSubmit = async (data: CreateServiceInput) => {
    if (isEditMode) {
      toast.success(`Servicio "${data.name}" actualizado correctamente`);
      navigate('/admin/services');
      return;
    }

    toast.success(`Servicio "${data.name}" registrado correctamente`);
    reset({ name: '' });
    setFocus('name');
  };

  const handleClear = () => {
    reset({ name: '' });
    setFocus('name');
    toast.message('Formulario limpiado');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditMode ? 'Editar servicio' : 'Registrar servicio'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? 'Actualice los datos del servicio seleccionado.'
            : 'Complete el formulario para registrar un nuevo servicio.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Editar servicio' : 'Nuevo servicio'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Modifique el nombre del servicio y guarde los cambios.'
              : 'Ingrese el nombre del servicio que quiere registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditMode && !selectedService ? (
            <p className="text-sm text-destructive">No se encontró el servicio solicitado.</p>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del servicio</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder="Ej: Reparación de impresora"
                    {...field}
                    value={field.value ?? ''}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar servicio'}
              </Button>
              {isEditMode ? (
                <Button type="button" variant="outline" onClick={() => navigate('/admin/services')} disabled={isSubmitting}>
                  Volver a la lista
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleClear} disabled={isSubmitting}>
                  Limpiar
                </Button>
              )}
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
