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

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserRole = z.infer<typeof roleNameSchema>;

export function getUserRoleName(user: Pick<User, 'role'> | null | undefined): string | null {
  if (!user?.role) return null;
  if (typeof user.role === 'string') return user.role;
  return user.role.name ?? null;
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
  return getUserRoleName(user) === 'admin';
}

export function isAgent(user: User | null): boolean {
  const roleName = getUserRoleName(user);
  return roleName === 'admin' || roleName === 'agent' || roleName === 'tecnico';
}
