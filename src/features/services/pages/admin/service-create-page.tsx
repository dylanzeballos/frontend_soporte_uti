import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceSchema, type CreateServiceInput } from '@/features/services/schemas';
import {
  useCreateServiceMutation,
  useServiceQuery,
  useUpdateServiceMutation,
} from '@/features/services/hooks';

export function ServiceCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const isEditMode = Number.isInteger(serviceId) && serviceId > 0;
  const { data: selectedService, isLoading: isLoadingService } = useServiceQuery(serviceId);
  const createMutation = useCreateServiceMutation();
  const updateMutation = useUpdateServiceMutation();


  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
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
      const result = await updateMutation.mutateAsync({ id: serviceId, data });
      toast.success(`Servicio "${result.name}" actualizado correctamente`);
      navigate('/admin/services/list');
      return;
    }

    const result = await createMutation.mutateAsync(data);
    toast.success(`Servicio "${result.name}" registrado correctamente`);
    reset({ name: '' });
    setFocus('name');
  };

  const handleClear = () => {
    reset({ name: '' });
    setFocus('name');
    toast.message('Formulario limpiado');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lively-hero rounded-(--radius-panel) px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Administracion</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            {isEditMode ? 'Editar servicio' : 'Registrar servicio'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {isEditMode
              ? 'Actualice los datos del servicio seleccionado.'
              : 'Complete el formulario para registrar un nuevo servicio.'}
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">{isEditMode ? 'Editar servicio' : 'Nuevo servicio'}</CardTitle>
          <CardDescription className="leading-6">
            {isEditMode
              ? 'Modifique el nombre del servicio y guarde los cambios.'
              : 'Ingrese el nombre del servicio que quiere registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isEditMode && isLoadingService ? (
            <p className="text-sm text-muted-foreground">Cargando datos del servicio...</p>
          ) : isEditMode && !selectedService ? (
            <p className="text-sm text-destructive">No se encontró el servicio solicitado.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar servicio'}
              </Button>
              {isEditMode ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/services/list')}
                  disabled={isSaving}
                >
                  Volver a la lista
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleClear} disabled={isSaving}>
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
