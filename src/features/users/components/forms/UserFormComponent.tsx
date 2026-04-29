import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userFormSchema, type UserFormValues } from '@/features/users/schemas';
import type { CorporationItem } from '@/features/corporations/hooks';
import type { RoleItem } from '@/features/roles/hooks';

type UserFormComponentProps = {
  initialValues: UserFormValues;
  mode: 'create' | 'edit';
  roles: RoleItem[];
  corporations: CorporationItem[];
  isSubmitting: boolean;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function UserFormComponent({
  initialValues,
  mode,
  roles,
  corporations,
  isSubmitting,
  onSubmit,
  onCancel,
}: UserFormComponentProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialValues,
  });

  const roleId = useWatch({ control, name: 'roleId' });
  const corporationId = useWatch({ control, name: 'corporationId' });
  const isActive = useWatch({ control, name: 'isActive' });

  const selectedRoleName = roles.find((role) => String(role.id) === roleId)?.name;
  const selectedCorporationName = corporations.find(
    (corporation) => String(corporation.id) === corporationId
  )?.name;

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onFormSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="user-ci">
                CI <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-ci"
                placeholder="Ej. 12345678"
                {...register('ci')}
                aria-invalid={errors.ci ? 'true' : 'false'}
              />
              {errors.ci && <p className="text-sm text-destructive">{errors.ci.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-first-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-first-name"
                placeholder="Ej. Juan"
                {...register('firstName')}
                aria-invalid={errors.firstName ? 'true' : 'false'}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-last-name">
                Apellido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-last-name"
                placeholder="Ej. Pérez"
                {...register('lastName')}
                aria-invalid={errors.lastName ? 'true' : 'false'}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-email"
                type="email"
                placeholder="Ej. usuario@empresa.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                {mode === 'create' ? 'Contraseña' : 'Contraseña (opcional)'}{' '}
                {mode === 'create' && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="user-password"
                type="password"
                placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : 'Solo si deseas cambiarla'}
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">
                Rol <span className="text-destructive">*</span>
              </Label>
              <Select
                value={roleId ?? ''}
                onValueChange={(value) => setValue('roleId', value)}
              >
                <SelectTrigger id="user-role" aria-invalid={errors.roleId ? 'true' : 'false'}>
                  <SelectValue placeholder="Selecciona rol">
                    {selectedRoleName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-sm text-destructive">{errors.roleId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-corporation">Corporación</Label>
              <Select
                value={corporationId || ''}
                onValueChange={(value) => setValue('corporationId', value || '')}
              >
                <SelectTrigger id="user-corporation">
                  <SelectValue placeholder="Sin corporación">
                    {selectedCorporationName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {corporations.map((corporation) => (
                    <SelectItem key={corporation.id} value={String(corporation.id)}>
                      {corporation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input
                id="user-phone"
                placeholder="Ej. 22445566"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-cell">Celular</Label>
              <Input
                id="user-cell"
                placeholder="Ej. 70000000"
                {...register('cell')}
              />
              {errors.cell && (
                <p className="text-sm text-destructive">{errors.cell.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-status">Estado</Label>
              <Select
                value={isActive ? 'true' : 'false'}
                onValueChange={(value) => setValue('isActive', value === 'true')}
              >
                <SelectTrigger id="user-status">
                  <SelectValue>
                    {isActive ? 'Activo' : 'Inactivo'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting || !roleId}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mode === 'create' ? 'Guardar' : 'Actualizar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
