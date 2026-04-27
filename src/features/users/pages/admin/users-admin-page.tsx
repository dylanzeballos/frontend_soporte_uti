import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUserRoleName, type CreateUserInput, type UpdateUserInput, type User } from '@/features/users/schemas';
import { useUsers } from '@/hooks/useApi';

const DEFAULT_LIMIT = 20;

type ActiveFilter = 'all' | 'true' | 'false';

type UserFormState = {
  ci: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  corporationId: string;
  phone: string;
  cell: string;
  isActive: boolean;
};

const INITIAL_FORM: UserFormState = {
  ci: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: '',
  corporationId: '',
  phone: '',
  cell: '',
  isActive: true,
};

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function getDisplayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { listPaginated, create, update, remove } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('true');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<UserFormState>(INITIAL_FORM);

  const isActive = useMemo(() => {
    if (activeFilter === 'all') return undefined;
    return activeFilter === 'true';
  }, [activeFilter]);

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ['users', page, DEFAULT_LIMIT, activeFilter],
    queryFn: () => listPaginated({ page, limit: DEFAULT_LIMIT, isActive }),
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      setShowForm(false);
      setForm(INITIAL_FORM);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) => update(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente');
      setEditingUser(null);
      setShowForm(false);
      setForm(INITIAL_FORM);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success('Usuario archivado correctamente');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const users = usersPage?.data ?? [];
  const total = usersPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));

  const startCreate = () => {
    setEditingUser(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      ci: user.ci ?? '',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      password: '',
      roleId: user.roleId ? String(user.roleId) : '',
      corporationId: user.corporationId ? String(user.corporationId) : '',
      phone: user.phone ?? '',
      cell: user.cell ?? '',
      isActive: user.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const basePayload = {
      ci: form.ci.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      roleId: toNumberOrUndefined(form.roleId),
      corporationId: toNumberOrUndefined(form.corporationId),
      phone: form.phone.trim() || undefined,
      cell: form.cell.trim() || undefined,
      isActive: form.isActive,
    };

    if (!basePayload.ci || !basePayload.firstName || !basePayload.lastName || !basePayload.email) {
      toast.error('Completa CI, nombre, apellido y email');
      return;
    }

    if (editingUser) {
      const payload: UpdateUserInput = {
        ...basePayload,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };
      await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
      return;
    }

    const password = form.password.trim();
    if (!password) {
      toast.error('El password es requerido para crear el usuario');
      return;
    }

    if (!basePayload.roleId) {
      toast.error('El roleId es requerido');
      return;
    }

    const payload: CreateUserInput = {
      ...basePayload,
      password,
      roleId: basePayload.roleId,
    };
    await createMutation.mutateAsync(payload);
  };

  const handleDelete = async (user: User) => {
    const confirmed = confirm(`¿Seguro que deseas archivar a "${getDisplayName(user)}"?`);
    if (!confirmed) return;
    await deleteMutation.mutateAsync(user.id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gestionar usuarios</h1>
        <div className="flex items-center gap-2">
          <Select
            value={activeFilter}
            onValueChange={(value) => {
              setPage(1);
              setActiveFilter(value as ActiveFilter);
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Solo activos</SelectItem>
              <SelectItem value="false">Solo inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar usuario
          </Button>
        </div>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="CI" value={form.ci} onChange={(e) => setForm((prev) => ({ ...prev, ci: e.target.value }))} />
              <Input
                placeholder="Nombre"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
              <Input
                placeholder="Apellido"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                type="password"
                placeholder={editingUser ? 'Password (opcional)' : 'Password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="roleId (ej: 1)"
                value={form.roleId}
                onChange={(e) => setForm((prev) => ({ ...prev, roleId: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="corporationId (ej: 1)"
                value={form.corporationId}
                onChange={(e) => setForm((prev) => ({ ...prev, corporationId: e.target.value }))}
              />
              <Input
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Celular"
                value={form.cell}
                onChange={(e) => setForm((prev) => ({ ...prev, cell: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {editingUser ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingUser(null);
                  setForm(INITIAL_FORM);
                  setShowForm(false);
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Listado de usuarios ({total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Corporación</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const roleName = getUserRoleName(user) ?? (user.roleId ? `Rol #${user.roleId}` : '-');
                    const corporationName = user.corporation?.name ?? (user.corporationId ? `Corp #${user.corporationId}` : '-');
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.ci ?? '-'}</TableCell>
                        <TableCell>{getDisplayName(user)}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {roleName}
                          </Badge>
                        </TableCell>
                        <TableCell>{corporationName}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{user.cell || '-'}</TableCell>
                        <TableCell>{user.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                        <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-BO') : '-'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(user)} aria-label="Editar usuario">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleDelete(user)}
                              aria-label="Archivar usuario"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
