import { useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CorporationItem, RoleItem } from '@/hooks/useApi';
import type { UserFormValues } from '../../hooks/useUsersAdmin';

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
  const [values, setValues] = useState(initialValues);
  const selectedRoleName = roles.find((role) => String(role.id) === values.roleId)?.name;
  const selectedCorporationName = corporations.find(
    (corporation) => String(corporation.id) === values.corporationId
  )?.name;
  const selectedStatusLabel = values.isActive ? 'Activo' : 'Inactivo';

  const setField = <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="user-ci">CI</Label>
              <Input
                id="user-ci"
                required
                placeholder="Ej. 12345678"
                value={values.ci}
                onChange={(event) => setField('ci', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-first-name">Nombre</Label>
              <Input
                id="user-first-name"
                required
                placeholder="Ej. Juan"
                value={values.firstName}
                onChange={(event) => setField('firstName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-last-name">Apellido</Label>
              <Input
                id="user-last-name"
                required
                placeholder="Ej. Pérez"
                value={values.lastName}
                onChange={(event) => setField('lastName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                required
                type="email"
                placeholder="Ej. usuario@empresa.com"
                value={values.email}
                onChange={(event) => setField('email', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">{mode === 'create' ? 'Password' : 'Password opcional'}</Label>
              <Input
                id="user-password"
                required={mode === 'create'}
                type="password"
                minLength={mode === 'create' ? 6 : undefined}
                placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : 'Solo si deseas cambiarlo'}
                value={values.password}
                onChange={(event) => setField('password', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Rol</Label>
              <Select value={values.roleId} onValueChange={(value) => setField('roleId', value)}>
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Selecciona rol">{selectedRoleName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-corporation">Corporación</Label>
              <Select value={values.corporationId || undefined} onValueChange={(value) => setField('corporationId', value)}>
                <SelectTrigger id="user-corporation">
                  <SelectValue placeholder="Sin corporación">{selectedCorporationName}</SelectValue>
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
                value={values.phone}
                onChange={(event) => setField('phone', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-cell">Celular</Label>
              <Input
                id="user-cell"
                placeholder="Ej. 70000000"
                value={values.cell}
                onChange={(event) => setField('cell', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-status">Estado</Label>
              <Select value={values.isActive ? 'true' : 'false'} onValueChange={(value) => setField('isActive', value === 'true')}>
                <SelectTrigger id="user-status">
                  <SelectValue>{selectedStatusLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting || !values.roleId}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
