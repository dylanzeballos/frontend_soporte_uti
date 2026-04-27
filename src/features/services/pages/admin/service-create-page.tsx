import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceSchema, type CreateServiceInput } from '@/features/services/schemas';
import { useServices } from '@/hooks/useApi';

export function ServiceCreatePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);
  const isEditMode = Number.isInteger(serviceId) && serviceId > 0;
  const { create, update, findOne } = useServices();

  const { data: selectedService, isLoading: isLoadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => findOne(serviceId),
    enabled: isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Servicio "${result.name}" registrado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      reset({ name: '' });
      setFocus('name');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateServiceInput) => update(serviceId, data),
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Servicio "${result.name}" actualizado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      navigate('/admin/services');
    },
  });

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
      await updateMutation.mutateAsync(data);
      return;
    }

    await createMutation.mutateAsync(data);
  };

  const handleClear = () => {
    reset({ name: '' });
    setFocus('name');
    toast.message('Formulario limpiado');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
          {isEditMode && isLoadingService ? (
            <p className="text-sm text-muted-foreground">Cargando datos del servicio...</p>
          ) : isEditMode && !selectedService ? (
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar servicio'}
              </Button>
              {isEditMode ? (
                <Button type="button" variant="outline" onClick={() => navigate('/admin/services')} disabled={isSaving}>
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
