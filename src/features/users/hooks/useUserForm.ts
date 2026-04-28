import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User, CreateUserInput, UpdateUserInput } from '@/features/users/schemas';
import { createUserSchema, updateUserSchema } from '@/features/users/schemas';
import type { RoleItem } from '@/hooks/useApi';

export interface CorporationOption {
  id: number;
  name: string;
}

export interface UseUserFormProps {
  mode: 'create' | 'edit';
  editingUser?: User | null;
  roles: RoleItem[];
  corporations: CorporationOption[];
}

export type UserFormValues = {
  ci: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number | '';
  corporationId: number | '';
  phone: string;
  cell: string;
  isActive: boolean;
};

export function useUserForm({ mode, editingUser, roles, corporations }: UseUserFormProps) {
  const schema = mode === 'create' ? createUserSchema : updateUserSchema;

  const defaultValues: UserFormValues = useMemo(() => {
    if (editingUser) {
      return {
        ci: editingUser.ci ?? '',
        firstName: editingUser.firstName ?? '',
        lastName: editingUser.lastName ?? '',
        email: editingUser.email,
        password: '',
        roleId: editingUser.roleId ? Number(editingUser.roleId) : '',
        corporationId: editingUser.corporationId ? Number(editingUser.corporationId) : '',
        phone: editingUser.phone ?? '',
        cell: editingUser.cell ?? '',
        isActive: editingUser.isActive,
      };
    }

    return {
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
  }, [editingUser, mode]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const getRoleLabel = useCallback(
    (roleId: number | string | null): string => {
      if (!roleId) return '-';
      const role = roles.find((r) => r.id === Number(roleId));
      return role?.name ?? `Rol #${roleId}`;
    },
    [roles]
  );

  const getCorporationLabel = useCallback(
    (corpId: number | string | null): string => {
      if (!corpId) return '-';
      const corp = corporations.find((c) => c.id === Number(corpId));
      return corp?.name ?? `Corporación #${corpId}`;
    },
    [corporations]
  );

  const preparePayload = useCallback(
    (values: UserFormValues): CreateUserInput | UpdateUserInput => {
      const basePayload = {
        ci: values.ci.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        roleId: values.roleId ? Number(values.roleId) : undefined,
        corporationId: values.corporationId ? Number(values.corporationId) : undefined,
        phone: values.phone.trim() || undefined,
        cell: values.cell.trim() || undefined,
        isActive: values.isActive,
      };

      if (mode === 'create') {
        return {
          ...basePayload,
          roleId: basePayload.roleId as number,
          password: values.password.trim(),
        } as CreateUserInput;
      }

      const updatePayload: UpdateUserInput = { ...basePayload };
      if (values.password.trim()) {
        updatePayload.password = values.password.trim();
      }
      return updatePayload;
    },
    [mode]
  );

  return {
    form,
    getRoleLabel,
    getCorporationLabel,
    preparePayload,
  };
}
