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
import { createUnitSchema, type CreateUnitInput } from '@/features/units/schemas';
import { useUnits } from '@/hooks/useApi';

export function UnitCreatePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const unitId = Number(id);
  const isEditMode = Number.isInteger(unitId) && unitId > 0;
  const { create, update, findOne } = useUnits();

  const { data: selectedUnit, isLoading: isLoadingUnit } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => findOne(unitId),
    enabled: isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Unidad "${result.name}" registrada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['units'] });
      reset({ name: '' });
      setFocus('name');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateUnitInput) => update(unitId, data),
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Unidad "${result.name}" actualizada correctamente`);
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
      navigate('/admin/units');
    },
  });

  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<CreateUnitInput>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (isEditMode && selectedUnit) {
      reset({ name: selectedUnit.name });
      return;
    }

    reset({ name: '' });
  }, [isEditMode, reset, selectedUnit]);

  const onSubmit = async (data: CreateUnitInput) => {
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
          {isEditMode ? 'Editar unidad' : 'Registrar unidad'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? 'Actualice los datos de la unidad seleccionada.'
            : 'Complete el formulario para registrar una nueva unidad.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Editar unidad' : 'Nueva unidad'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Modifique el nombre de la unidad y guarde los cambios.'
              : 'Ingrese el nombre de la unidad que quiera registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditMode && isLoadingUnit ? (
            <p className="text-sm text-muted-foreground">Cargando datos de la unidad...</p>
          ) : isEditMode && !selectedUnit ? (
            <p className="text-sm text-destructive">No se encontró la unidad solicitada.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la unidad</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Ej: Dirección de carrera de Ingeniería Financiera"
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
                  {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar unidad'}
                </Button>
                {isEditMode ? (
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/units')} disabled={isSaving}>
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
