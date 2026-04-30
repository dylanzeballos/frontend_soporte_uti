import { Mail, Pencil, Trash2, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User } from '@/features/users/schemas';
import { getUserRoleName } from '@/features/users/schemas';
import { cn } from '@/lib/utils';

type UsersTableProps = {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isDeleting: boolean;
  onEdit: (user: User) => void;
  onArchive: (user: User) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

const roleClass: Record<string, string> = {
  admin: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
  agent: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  tecnico: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  cliente: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300',
  user: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
};

function displayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

function roleLabel(user: User): string {
  return getUserRoleName(user) ?? (user.roleId ? `Rol #${user.roleId}` : 'Sin rol');
}

function roleBadgeClass(user: User): string {
  const role = roleLabel(user).toLowerCase();
  return roleClass[role] ?? roleClass.user;
}

export function UsersTable({
  users,
  total,
  page,
  totalPages,
  isLoading,
  isDeleting,
  onEdit,
  onArchive,
  onPreviousPage,
  onNextPage,
}: UsersTableProps) {
  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" />
            Usuarios
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{total} resultado(s)</p>
        </div>
        <div className="rounded-md border bg-background/80 px-3 py-1.5 text-sm text-muted-foreground">
          Página {page} / {totalPages}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Usuario</TableHead>
                <TableHead>CI</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Corporación</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id} className="align-top">
                    <TableCell>
                      <div className="font-medium text-foreground">{displayName(user)}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{user.ci || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('capitalize', roleBadgeClass(user))}>
                        {roleLabel(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.corporation?.name ?? (user.corporationId ? `#${user.corporationId}` : '-')}</TableCell>
                    <TableCell>
                      <div>{user.phone || '-'}</div>
                      <div className="text-xs text-muted-foreground">{user.cell || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-BO') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Editar usuario" onClick={() => onEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Archivar usuario"
                          disabled={isDeleting || !user.isActive}
                          onClick={() => onArchive(user)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Sin usuarios para estos filtros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={page <= 1 || isLoading} onClick={onPreviousPage}>
            Anterior
          </Button>
          <Button variant="outline" disabled={page >= totalPages || isLoading} onClick={onNextPage}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
