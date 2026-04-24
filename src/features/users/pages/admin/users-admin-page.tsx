import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useUsers } from '@/hooks/useApi';
import type { User, UserRole } from '@/features/users/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Nombre"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <Select
                value={newUser.role || 'user'}
                onValueChange={(v) => setNewUser({ ...newUser, role: (v as UserRole) || 'user' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
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
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : users.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {users.map((user: User) => (
                <div key={user.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {String(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{String(user.name || 'Sin nombre')}</div>
                      <div className="text-sm text-muted-foreground">{String(user.email || 'Sin email')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay usuarios para mostrar
          </CardContent>
        </Card>
      )}
    </div>
  );
}
