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
import { createRoleSchema, type CreateRoleInput } from '@/features/roles/schemas';
import { useRoles } from '@/hooks/useApi';

export function RoleCreatePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const isEditMode = Number.isInteger(roleId) && roleId > 0;
  const { create, update, findOne } = useRoles();

  const { data: selectedRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => findOne(roleId),
    enabled: isEditMode,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Rol o cargo "${result.name}" registrado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      reset({ name: '' });
      setFocus('name');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateRoleInput) => update(roleId, data),
    onSuccess: (result) => {
      if (!result) return;
      toast.success(`Rol o cargo "${result.name}" actualizado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      navigate('/admin/roles');
    },
  });

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
          {isEditMode ? 'Editar rol o cargo' : 'Registrar rol o cargo'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? 'Actualice los datos del rol o cargo seleccionado.'
            : 'Complete el formulario para registrar un nuevo rol o cargo.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Editar rol o cargo' : 'Nuevo rol o cargo'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Modifique el nombre del rol o cargo y guarde los cambios.'
              : 'Ingrese el nombre del rol o cargo que quiere registrar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditMode && isLoadingRole ? (
            <p className="text-sm text-muted-foreground">Cargando datos del rol o cargo...</p>
          ) : isEditMode && !selectedRole ? (
            <p className="text-sm text-destructive">No se encontró el rol o cargo solicitado.</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/roles')} disabled={isSaving}>
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
