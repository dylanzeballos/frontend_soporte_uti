import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BriefcaseBusiness, Plus, Trash2 } from 'lucide-react';
import { useRoles } from '@/hooks/useApi';
import type { RoleItem } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RolesAdminPage() {
  const queryClient = useQueryClient();
  const { list, create, remove } = useRoles();

  const { data: roles = [], isLoading } = useQuery<RoleItem[]>({
    queryKey: ['roles'],
    queryFn: list,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Rol creado correctamente');
      setShowCreate(false);
      setNewRole({ name: '', description: '' });
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => toast.error('No se pudo crear el rol'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Rol eliminado');
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => toast.error('No se pudo eliminar el rol'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  const handleCreate = () => {
    if (!newRole.name.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }
    createMutation.mutate(newRole);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`¿Eliminar el rol "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <section className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
        <div className="editorial-kicker">
          <BriefcaseBusiness className="h-3.5 w-3.5" />
          Administración
        </div>
        <h1 className="mt-5 text-[clamp(1.8rem,2.9vw,2.8rem)] font-bold tracking-[-0.02em] text-foreground">
          Gestionar roles
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Administra los roles y cargos disponibles en el sistema.
        </p>
      </section>

      <div className="flex items-center justify-between">
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo rol
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Crear rol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Nombre *</Label>
                <Input
                  id="role-name"
                  placeholder="Ej: Técnico especialista"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-desc">Descripción</Label>
                <Input
                  id="role-desc"
                  placeholder="Descripción del rol"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole({ ...newRole, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando…' : 'Crear'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setNewRole({ name: '', description: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="editorial-inset rounded-md py-12 text-center text-muted-foreground">
          Cargando roles…
        </div>
      ) : roles.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Roles ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-foreground/6">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <BriefcaseBusiness
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Eliminar rol ${role.name}`}
                    onClick={() => handleDelete(role.id, role.name)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <BriefcaseBusiness
              className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="font-medium text-foreground">Sin roles registrados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer rol con el botón de arriba.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
