import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { staticUnits } from '@/features/units/data/static-units';
import { createUnitSchema, type CreateUnitInput } from '@/features/units/schemas';

export function UnitCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const unitId = Number(id);
  const isEditMode = Number.isFinite(unitId);
  const selectedUnit = isEditMode
    ? staticUnits.find((unit) => unit.id === unitId) ?? null
    : null;

  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
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
      toast.success(`Unidad "${data.name}" actualizada correctamente`);
      navigate('/admin/units');
      return;
    }

    toast.success(`Unidad "${data.name}" registrada correctamente`);
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
          {isEditMode && !selectedUnit ? (
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar unidad'}
              </Button>
              {isEditMode ? (
                <Button type="button" variant="outline" onClick={() => navigate('/admin/units')} disabled={isSubmitting}>
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
