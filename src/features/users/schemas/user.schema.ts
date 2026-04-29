import { z } from 'zod';

const roleNameSchema = z.enum(['admin', 'agent', 'user', 'cliente', 'tecnico']).or(z.string().min(1));

const roleSchema = z.object({
  id: z.number(),
  name: roleNameSchema,
  description: z.string().nullable().optional(),
});

const corporationSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean().optional(),
});

export const userSchema = z.object({
  id: z.number(),
  ci: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.email(),
  name: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional().nullable(),
  cell: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  corporationId: z.number().optional().nullable(),
  roleId: z.number().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  role: z.union([roleNameSchema, roleSchema]).optional().nullable(),
  corporation: corporationSchema.optional().nullable(),
});

export const createUserSchema = z.object({
  ci: z.string().min(1, 'CI requerido'),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roleId: z.number().int().positive('Rol requerido'),
  corporationId: z.number().int().positive().optional(),
  phone: z.string().optional(),
  cell: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  ci: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.number().int().positive().optional(),
  corporationId: z.number().int().positive().optional(),
  phone: z.string().optional(),
  cell: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Form validation schema (string-based IDs for form inputs)
export const userFormSchema = z.object({
  ci: z.string().min(1, 'CI es requerido').max(20, 'Máximo 20 caracteres'),
  firstName: z.string().min(1, 'Nombre es requerido').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().min(1, 'Apellido es requerido').max(100, 'Máximo 100 caracteres'),
  email: z.email('Email inválido').min(1, 'Email es requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(100, 'Máximo 100 caracteres'),
  roleId: z.string().min(1, 'Rol es requerido'),
  corporationId: z.string().optional().nullable(),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional(),
  cell: z.string().max(20, 'Máximo 20 caracteres').optional(),
  isActive: z.boolean(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFormValues = z.infer<typeof userFormSchema>;
export type UserRole = z.infer<typeof roleNameSchema>;
export type AppUserRole = 'admin' | 'agent' | 'user';

export function getUserRoleName(user: Pick<User, 'role'> | null | undefined): string | null {
  if (!user?.role) return null;
  if (typeof user.role === 'string') return user.role;
  return user.role.name ?? null;
}

export function normalizeAppRoleName(role: string | null | undefined): AppUserRole {
  const normalized = role?.trim().toLowerCase();

  if (normalized === 'admin') return 'admin';
  if (normalized === 'agent' || normalized === 'tecnico') return 'agent';
  return 'user';
}

export function getAppUserRole(user: Pick<User, 'role'> | null | undefined): AppUserRole {
  return normalizeAppRoleName(getUserRoleName(user));
}

export function getDefaultRouteForUser(user: Pick<User, 'role'> | null | undefined): string {
  return getAppUserRole(user) === 'agent' ? '/technician/dashboard' : '/dashboard';
}

export function hasRole(user: User | null, requiredRole: UserRole | UserRole[]): boolean {
  const roleName = getUserRoleName(user);
  if (!user || !roleName) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(roleName);
  }
  return roleName === requiredRole;
}

export function isAdmin(user: User | null): boolean {
  return getAppUserRole(user) === 'admin';
}

export function isAgent(user: User | null): boolean {
  const appRole = getAppUserRole(user);
  return appRole === 'admin' || appRole === 'agent';
}
