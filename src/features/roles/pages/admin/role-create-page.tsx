import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { staticRoles } from '@/features/roles/data/static-roles';
import { createRoleSchema, type CreateRoleInput } from '@/features/roles/schemas';

export function RoleCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const isEditMode = Number.isInteger(roleId) && roleId > 0;
  const selectedRole = isEditMode
    ? staticRoles.find((role) => role.id === roleId) ?? null
    : null;

  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
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
      toast.success(`Rol o cargo "${data.name}" actualizado correctamente`);
      navigate('/admin/roles');
      return;
    }

    toast.success(`Rol o cargo "${data.name}" registrado correctamente`);
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
          {isEditMode && !selectedRole ? (
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar rol o cargo'}
                </Button>
                {isEditMode ? (
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/roles')} disabled={isSubmitting}>
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
