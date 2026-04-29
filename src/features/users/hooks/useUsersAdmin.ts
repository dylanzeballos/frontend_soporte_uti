import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CreateUserInput, UpdateUserInput, User, UserFormValues } from '@/features/users/schemas';
import { getUserRoleName } from '@/features/users/schemas';
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/features/users/hooks';
import { useRolesQuery } from '@/features/roles/hooks';
import type { CorporationItem } from '@/features/corporations/hooks';

export { type UserFormValues };

const DEFAULT_LIMIT = 20;

export const emptyUserFormValues: UserFormValues = {
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

function getDisplayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

function getUserCorporationId(user: User): number | null {
  return user.corporationId ?? user.corporation?.id ?? null;
}

function getUserRoleId(user: User): number | null {
  return user.roleId ?? (typeof user.role === 'object' && user.role ? user.role.id : null) ?? null;
}

function toFormValues(user: User | null): UserFormValues {
  if (!user) return emptyUserFormValues;

  return {
    ci: user.ci ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email,
    password: '',
    roleId: getUserRoleId(user)?.toString() ?? '',
    corporationId: getUserCorporationId(user)?.toString() ?? '',
    phone: user.phone ?? '',
    cell: user.cell ?? '',
    isActive: user.isActive ?? true,
  };
}

function toPayload(values: UserFormValues, mode: 'create' | 'edit'): CreateUserInput | UpdateUserInput {
  const base = {
    ci: values.ci.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    roleId: Number(values.roleId),
    corporationId: values.corporationId ? Number(values.corporationId) : undefined,
    phone: values.phone?.trim() || undefined,
    cell: values.cell?.trim() || undefined,
    isActive: values.isActive,
  };

  if (mode === 'create') {
    return {
      ...base,
      password: values.password.trim(),
    };
  }

  return {
    ...base,
    password: values.password.trim() || undefined,
  };
}

export function useUsersAdmin() {
  const usersQuery = useUsersQuery({ limit: 100 });
  const rolesQuery = useRolesQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState('all');
  const [corporationId, setCorporationId] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const allUsers = usersQuery.data?.data ?? (Array.isArray(usersQuery.data) ? usersQuery.data : []);

    return allUsers.filter((user: User) => {
      const searchable = [
        user.ci,
        getDisplayName(user),
        user.email,
        user.phone,
        user.cell,
        getUserRoleName(user),
        user.corporation?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = normalizedSearch.length === 0 || searchable.includes(normalizedSearch);
      const matchesRole = roleId === 'all' || getUserRoleId(user)?.toString() === roleId;
      const matchesCorporation =
        corporationId === 'all' || getUserCorporationId(user)?.toString() === corporationId;

      return matchesSearch && matchesRole && matchesCorporation;
    });
  }, [corporationId, roleId, search, usersQuery.data]);

  const corporations = useMemo<CorporationItem[]>(() => {
    const byId = new Map<number, CorporationItem>();
    const allUsers = usersQuery.data?.data ?? (Array.isArray(usersQuery.data) ? usersQuery.data : []);

    for (const user of allUsers) {
      const id = getUserCorporationId(user);
      if (!id || byId.has(id)) continue;

      byId.set(id, {
        id,
        name: user.corporation?.name ?? `Corporación #${id}`,
        isActive: user.corporation?.isActive,
      });
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [usersQuery.data]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / DEFAULT_LIMIT));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((currentPage - 1) * DEFAULT_LIMIT, currentPage * DEFAULT_LIMIT);

  const resetFilters = () => {
    setSearch('');
    setRoleId('all');
    setCorporationId('all');
    setPage(1);
  };

  const startCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingUser(null);
    setShowForm(false);
  };

  const submitForm = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, data: toPayload(values, 'edit') as UpdateUserInput });
        toast.success('Usuario actualizado');
      } else {
        await createMutation.mutateAsync(toPayload(values, 'create') as CreateUserInput);
        toast.success('Usuario creado');
      }
      cancelForm();
    } catch {
      // Error handled by mutation
    }
  };

  const archiveUser = (user: User) => {
    const confirmed = window.confirm(`Archivar usuario "${getDisplayName(user)}"?`);
    if (!confirmed) return;

    deleteMutation.mutate(user.id, {
      onSuccess: () => toast.success('Usuario archivado'),
    });
  };

  return {
    users: pageUsers,
    total: filteredUsers.length,
    page: currentPage,
    totalPages,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    roles: rolesQuery.data ?? [],
    corporations,
    filters: { search, roleId, corporationId },
    formValues: toFormValues(editingUser),
    showForm,
    editingUser,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setRoleId: (value: string) => {
      setRoleId(value);
      setPage(1);
    },
    setCorporationId: (value: string) => {
      setCorporationId(value);
      setPage(1);
    },
    resetFilters,
    startCreate,
    startEdit,
    cancelForm,
    submitForm,
    archiveUser,
  };
}
