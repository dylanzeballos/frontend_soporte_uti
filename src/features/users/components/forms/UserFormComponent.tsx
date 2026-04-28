import { Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import type { User } from '@/features/users/schemas';
import type { RoleItem } from '@/hooks/useApi';
import type { CorporationOption, UserFormValues } from '../../hooks/useUserForm';

interface UserFormProps {
  form: UseFormReturn<UserFormValues>;
  mode: 'create' | 'edit';
  editingUser?: User | null;
  roles: RoleItem[];
  corporations: CorporationOption[];
  isSubmitting: boolean;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel: () => void;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function UserFormComponent({
  form,
  mode,
  roles,
  corporations,
  isSubmitting,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 md:grid-cols-3">
            {/* CI */}
            <div className="space-y-2">
              <Label htmlFor="ci" className="text-sm font-medium">
                CI
              </Label>
              <Input
                id="ci"
                placeholder="Ej. 123456789"
                {...register('ci')}
                aria-invalid={Boolean(errors.ci)}
                disabled={isSubmitting}
              />
              <FormError message={errors.ci?.message} />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                Nombre
              </Label>
              <Input
                id="firstName"
                placeholder="Ej. Juan"
                {...register('firstName')}
                aria-invalid={Boolean(errors.firstName)}
                disabled={isSubmitting}
              />
              <FormError message={errors.firstName?.message} />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Apellido
              </Label>
              <Input
                id="lastName"
                placeholder="Ej. García"
                {...register('lastName')}
                aria-invalid={Boolean(errors.lastName)}
                disabled={isSubmitting}
              />
              <FormError message={errors.lastName?.message} />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej. usuario@ejemplo.com"
                {...register('email')}
                aria-invalid={Boolean(errors.email)}
                disabled={isSubmitting}
              />
              <FormError message={errors.email?.message} />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {mode === 'create' ? 'Contraseña' : 'Contraseña (opcional)'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'create' ? 'Ej. minimo6caracteres' : 'Dejar en blanco para no cambiar'}
                {...register('password')}
                aria-invalid={Boolean(errors.password)}
                disabled={isSubmitting}
              />
              <FormError message={errors.password?.message} />
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="roleId" className="text-sm font-medium">
                Rol <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : '')}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="roleId" aria-invalid={Boolean(fieldState.error)}>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormError message={fieldState.error?.message} />
                  </>
                )}
              />
            </div>

            {/* Corporación */}
            <div className="space-y-2">
              <Label htmlFor="corporationId" className="text-sm font-medium">
                Corporación
              </Label>
              <Controller
                control={control}
                name="corporationId"
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : '')}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="corporationId" aria-invalid={Boolean(fieldState.error)}>
                        <SelectValue placeholder="Selecciona una corporación" />
                      </SelectTrigger>
                      <SelectContent>
                        {corporations.map((corp) => (
                          <SelectItem key={corp.id} value={String(corp.id)}>
                            {corp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormError message={fieldState.error?.message} />
                  </>
                )}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Teléfono
              </Label>
              <Input
                id="phone"
                placeholder="Ej. +591 2 1234567"
                {...register('phone')}
                aria-invalid={Boolean(errors.phone)}
                disabled={isSubmitting}
              />
              <FormError message={errors.phone?.message} />
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <Label htmlFor="cell" className="text-sm font-medium">
                Celular
              </Label>
              <Input
                id="cell"
                placeholder="Ej. +591 7 12345678"
                {...register('cell')}
                aria-invalid={Boolean(errors.cell)}
                disabled={isSubmitting}
              />
              <FormError message={errors.cell?.message} />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="isActive" className="text-sm font-medium">
                Estado
              </Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Select value={field.value ? 'true' : 'false'} onValueChange={(value) => field.onChange(value === 'true')}>
                    <SelectTrigger id="isActive" disabled={isSubmitting}>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Guardar' : 'Actualizar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
