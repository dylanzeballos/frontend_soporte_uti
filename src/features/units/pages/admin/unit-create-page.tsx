import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createUnitSchema, type CreateUnitInput } from '@/features/units/schemas';
import { useCreateUnitMutation, useUnitQuery, useUpdateUnitMutation } from '@/features/units/hooks';

export function UnitCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const unitId = Number(id);
  const isEditMode = Number.isInteger(unitId) && unitId > 0;
  const { data: selectedUnit, isLoading: isLoadingUnit } = useUnitQuery(unitId);
  const createMutation = useCreateUnitMutation();
  const updateMutation = useUpdateUnitMutation();

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
      const result = await updateMutation.mutateAsync({ id: unitId, data });
      toast.success(`Unidad "${result.name}" actualizada correctamente`);
      navigate('/admin/units/list');
      return;
    }

    const result = await createMutation.mutateAsync(data);
    toast.success(`Unidad "${result.name}" registrada correctamente`);
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
            {isEditMode ? 'Editar unidad' : 'Registrar unidad'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {isEditMode
              ? 'Actualice los datos de la unidad seleccionada.'
              : 'Complete el formulario para registrar una nueva unidad.'}
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">{isEditMode ? 'Editar unidad' : 'Nueva unidad'}</CardTitle>
          <CardDescription className="leading-6">
            {isEditMode
              ? 'Modifique el nombre de la unidad y guarde los cambios.'
              : 'Ingrese el nombre de la unidad que quiera registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isEditMode && isLoadingUnit ? (
            <p className="text-sm text-muted-foreground">Cargando datos de la unidad...</p>
          ) : isEditMode && !selectedUnit ? (
            <p className="text-sm text-destructive">No se encontró la unidad solicitada.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar unidad'}
                </Button>
                {isEditMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/units/list')}
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
