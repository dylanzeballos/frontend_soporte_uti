import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';
import { useUsers } from '@/hooks/useApi';
import type { User, UserRole } from '@/features/users/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  agent: 'Agente',
  user: 'Usuario',
};

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { list, create, remove } = useUsers();

  const { data: users = [], isLoading: loading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: list,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      setShowCreate(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' as UserRole });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as UserRole });

  const handleCreate = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    createMutation.mutate(newUser);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <section className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="editorial-kicker">
              <Users className="h-3.5 w-3.5" />
              Administración
            </div>
            <h1 className="mt-5 text-[clamp(1.8rem,2.9vw,2.8rem)] font-bold tracking-[-0.02em] text-foreground">
              Gestión de Usuarios
            </h1>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </section>

      {showCreate && (
        <Card className="rounded-md">
          <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
            <CardTitle>Crear Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="editorial-inset rounded-md p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-name" className="editorial-label text-muted-foreground">
                    Nombre
                  </Label>
                  <Input
                    id="new-name"
                    placeholder="Nombre completo"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email" className="editorial-label text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="correo@institución.edu"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="editorial-label text-muted-foreground">
                    Contraseña
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role" className="editorial-label text-muted-foreground">
                    Rol
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser({ ...newUser, role: (v as UserRole) })}
                  >
                    <SelectTrigger id="new-role">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                Crear
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="editorial-inset rounded-md py-14 text-center text-muted-foreground">
          Cargando usuarios...
        </div>
      ) : users.length > 0 ? (
        <Card className="rounded-md">
          <CardHeader className="px-6 pt-6 sm:px-8 sm:pt-8">
            <CardTitle>Usuarios ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6 pb-6 sm:px-8 sm:pb-8">
            {users.map((user: User) => (
              <div
                key={user.id}
                className="editorial-inset flex items-center justify-between rounded-md p-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
                    {String(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {String(user.name || 'Sin nombre')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {String(user.email || 'Sin email')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{roleLabels[user.role] ?? user.role}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar usuario ${user.name}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="editorial-inset rounded-md py-14 text-center">
          <p className="text-base font-medium text-foreground">No hay usuarios para mostrar</p>
        </div>
      )}
    </div>
  );
}
