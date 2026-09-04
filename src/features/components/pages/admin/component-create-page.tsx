import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createComponentSchema, type CreateComponentInput } from '@/features/components/schemas';
import { useComponents } from '@/hooks/useApi';

export function ComponentCreatePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const componentId = Number(id);
  const isEditMode = Number.isInteger(componentId) && componentId > 0;
  const { create, update, findOne } = useComponents();

  const { data: selectedComponent, isLoading: isLoadingComponent } = useQuery({
    queryKey: ['component', componentId],
    queryFn: () => findOne(componentId),
    enabled: isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Componente "${result.name}" registrado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['components'] });
      navigate('/admin/components/list');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateComponentInput) => update(componentId, data),
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Componente "${result.name}" actualizado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['component', componentId] });
      navigate('/admin/components/list');
    },
  });

  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<CreateComponentInput>({
    resolver: zodResolver(createComponentSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isEditMode && selectedComponent) {
      reset({
        name: selectedComponent.name,
        description: selectedComponent.description ?? '',
      });
      return;
    }

    reset({ name: '', description: '' });
  }, [isEditMode, reset, selectedComponent]);

  const onSubmit = async (data: CreateComponentInput) => {
    if (isEditMode) {
      await updateMutation.mutateAsync(data);
      return;
    }

    await createMutation.mutateAsync(data);
  };

  const handleClear = () => {
    reset({ name: '', description: '' });
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
            {isEditMode ? 'Editar componente' : 'Registrar componente'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {isEditMode
              ? 'Actualice los datos del componente seleccionado.'
              : 'Complete el formulario para registrar un nuevo componente.'}
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">{isEditMode ? 'Editar componente' : 'Nuevo componente'}</CardTitle>
          <CardDescription className="leading-6">
            {isEditMode
              ? 'Modifique el nombre y la descripcion del componente y guarde los cambios.'
              : 'Ingrese los datos del componente que quiere registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isEditMode && isLoadingComponent ? (
            <p className="text-sm text-muted-foreground">Cargando datos del componente...</p>
          ) : isEditMode && !selectedComponent ? (
            <p className="text-sm text-destructive">No se encontro el componente solicitado.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del componente</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Ej: SSD 480GB, Memoria RAM 8GB, Mouse"
                      {...field}
                      value={field.value ?? ''}
                    />
                  )}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion (opcional)</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="description"
                      placeholder="Ej: Disco solido para reemplazo de unidades dañadas"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  )}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar componente'}
                </Button>
                {isEditMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/components/list')}
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
