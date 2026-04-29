import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createRoleSchema, type CreateRoleInput } from '@/features/roles/schemas';
import { useCreateRoleMutation, useRoleQuery, useUpdateRoleMutation } from '@/features/roles/hooks';

export function RoleCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const isEditMode = Number.isInteger(roleId) && roleId > 0;
  const { data: selectedRole, isLoading: isLoadingRole } = useRoleQuery(roleId);
  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();

  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (isEditMode && selectedRole) {
      reset({ name: selectedRole.name });
      return;
    }

    reset({ name: '' });
  }, [isEditMode, reset, selectedRole]);

  const onSubmit = async (data: CreateRoleInput) => {
    if (isEditMode) {
      const result = await updateMutation.mutateAsync({ id: roleId, data });
      toast.success(`Rol o cargo "${result.name}" actualizado correctamente`);
      navigate('/admin/roles/list');
      return;
    }

    const result = await createMutation.mutateAsync(data);
    toast.success(`Rol o cargo "${result.name}" registrado correctamente`);
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
            {isEditMode ? 'Editar rol o cargo' : 'Registrar rol o cargo'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {isEditMode
              ? 'Actualice los datos del rol o cargo seleccionado.'
              : 'Complete el formulario para registrar un nuevo rol o cargo.'}
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">{isEditMode ? 'Editar rol o cargo' : 'Nuevo rol o cargo'}</CardTitle>
          <CardDescription className="leading-6">
            {isEditMode
              ? 'Modifique el nombre del rol o cargo y guarde los cambios.'
              : 'Ingrese el nombre del rol o cargo que quiere registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isEditMode && isLoadingRole ? (
            <p className="text-sm text-muted-foreground">Cargando datos del rol o cargo...</p>
          ) : isEditMode && !selectedRole ? (
            <p className="text-sm text-destructive">No se encontró el rol o cargo solicitado.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del rol o cargo</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      placeholder="Ej: Encargado de infraestructura"
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
                  {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar rol o cargo'}
                </Button>
                {isEditMode ? (
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/roles/list')} disabled={isSaving}>
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
