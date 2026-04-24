import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createUnitSchema, type CreateUnitInput } from '@/features/units/schemas';

export function UnitCreatePage() {
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

  const onSubmit = async (data: CreateUnitInput) => {
    toast.success(`Unidad "${data.name}" registrada correctamente`);
    reset();
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
        <h1 className="text-2xl font-bold tracking-tight">Registrar unidad</h1>
        <p className="text-sm text-muted-foreground">
          Complete el formulario para registrar una nueva unidad.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva unidad</CardTitle>
          <CardDescription>Ingrese el nombre de la unidad que quiera registrar.</CardDescription>
        </CardHeader>
        <CardContent>
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
                {isSubmitting ? 'Guardando...' : 'Registrar unidad'}
              </Button>
              <Button type="button" variant="outline" onClick={handleClear} disabled={isSubmitting}>
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
