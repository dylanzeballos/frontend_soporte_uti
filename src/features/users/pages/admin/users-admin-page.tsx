import { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { CreateUserInput, UpdateUserInput, User } from '@/features/users/schemas';
import { useUsers } from '@/hooks/useApi';
import { useRoles, useCorporations } from '@/hooks/useApi';
import { UserFormComponent } from '@/features/users/components/forms/UserFormComponent';
import { UsersTable } from '@/features/users/components/tables/UsersTable';
import { useUserForm } from '@/features/users/hooks/useUserForm';

const DEFAULT_LIMIT = 20;

type ActiveFilter = 'all' | 'true' | 'false';

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { listPaginated, create, update, remove } = useUsers();
  const { list: listRoles } = useRoles();
  const { list: listCorporations } = useCorporations();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(1);

  // Fetch roles y corporaciones
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  });

  const { data: corporations = [] } = useQuery({
    queryKey: ['corporations'],
    queryFn: listCorporations,
  });

  // Determinar si activo
  const isActive = activeFilter === 'all' ? undefined : activeFilter === 'true';

  // Fetch users
  const { data: usersPage, isLoading } = useQuery({
    queryKey: ['users', page, DEFAULT_LIMIT, activeFilter],
    queryFn: () => listPaginated({ page, limit: DEFAULT_LIMIT, isActive }),
  });

  // Setup form hook
  const userFormHook = useUserForm({
    mode: editingUser ? 'edit' : 'create',
    editingUser: editingUser || undefined,
    roles,
    corporations: corporations.map((c) => ({ id: c.id, name: c.name })),
  });

  // Reset form cuando cambia modo
  useEffect(() => {
    userFormHook.form.reset();
  }, [editingUser, showForm, userFormHook.form]);

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      setShowForm(false);
      setEditingUser(null);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      toast.error('Error al crear el usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) => update(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente');
      setShowForm(false);
      setEditingUser(null);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      toast.error('Error al actualizar el usuario');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success('Usuario archivado correctamente');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      toast.error('Error al archivar el usuario');
    },
  });

  const users = usersPage?.data ?? [];
  const total = usersPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));

  const startCreate = useCallback(() => {
    setEditingUser(null);
    setShowForm(true);
  }, []);

  const startEdit = useCallback((user: User) => {
    setEditingUser(user);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(
    async (values: any) => {
      try {
        const payload = userFormHook.preparePayload(values);

        if (!editingUser) {
          // Crear
          const createPayload = payload as CreateUserInput;
          if (!createPayload.ci || !createPayload.firstName || !createPayload.lastName || !createPayload.email) {
            toast.error('Completa CI, nombre, apellido y email');
            return;
          }
          if (!createPayload.roleId) {
            toast.error('El rol es requerido');
            return;
          }
          await createMutation.mutateAsync(createPayload);
        } else {
          // Actualizar
          const updatePayload = payload as UpdateUserInput;
          await updateMutation.mutateAsync({ id: editingUser.id, data: updatePayload });
        }
      } catch (error) {
        console.error('Error al guardar:', error);
      }
    },
    [editingUser, userFormHook, createMutation, updateMutation]
  );

  const handleDelete = useCallback((user: User) => {
    const confirmed = confirm(
      `¿Seguro que deseas archivar a "${[user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email}"?`
    );
    if (!confirmed) return;
    deleteMutation.mutate(user.id);
  }, [deleteMutation]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Gestionar usuarios</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="active-filter" className="text-sm font-medium">
              Filtrar:
            </Label>
            <Select
              value={activeFilter}
              onValueChange={(value) => {
                setPage(1);
                setActiveFilter(value as ActiveFilter);
              }}
            >
              <SelectTrigger id="active-filter" className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startCreate} disabled={showForm}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar usuario
          </Button>
        </div>
      </div>

      {showForm ? (
        <UserFormComponent
          form={userFormHook.form}
          mode={editingUser ? 'edit' : 'create'}
          editingUser={editingUser}
          roles={roles}
          corporations={corporations.map((c) => ({ id: c.id, name: c.name }))}
          isSubmitting={isSaving}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
            userFormHook.form.reset();
          }}
        />
      ) : null}

      <UsersTable
        users={users}
        isLoading={isLoading}
        total={total}
        page={page}
        totalPages={totalPages}
        roles={roles}
        corporations={corporations.map((c) => ({ id: c.id, name: c.name }))}
        isDeleting={deleteMutation.isPending}
        onEdit={startEdit}
        onDelete={handleDelete}
        onPreviousPage={() => setPage((current) => current - 1)}
        onNextPage={() => setPage((current) => current + 1)}
      />
    </div>
  );
}
