import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User } from '@/features/users/schemas';
import type { RoleItem } from '@/hooks/useApi';
import type { CorporationOption } from '../../hooks/useUserForm';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  roles: RoleItem[];
  corporations: CorporationOption[];
  isDeleting: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function getDisplayName(user: User): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.name || user.email;
}

export function UsersTable({
  users,
  isLoading,
  total,
  page,
  totalPages,
  roles,
  corporations,
  isDeleting,
  onEdit,
  onDelete,
  onPreviousPage,
  onNextPage,
}: UsersTableProps) {
  const getRoleLabel = (roleId: number | null | undefined): string => {
    if (!roleId) return '-';
    const role = roles.find((r) => r.id === roleId);
    return role?.name ?? `Rol #${roleId}`;
  };

  const getCorporationLabel = (corpId: number | null | undefined): string => {
    if (!corpId) return '-';
    const corp = corporations.find((c) => c.id === corpId);
    return corp?.name ?? `Corporación #${corpId}`;
  };

  return (
    <div className="space-y-4">
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
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.ci ?? '-'}</TableCell>
                      <TableCell>{getDisplayName(user)}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {getRoleLabel(user.roleId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCorporationLabel(user.corporationId)}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{user.cell || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-BO') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(user)}
                            aria-label="Editar usuario"
                            disabled={isDeleting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(user)}
                            aria-label="Archivar usuario"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
            <Button variant="outline" disabled={page <= 1 || isLoading} onClick={onPreviousPage}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button variant="outline" disabled={page >= totalPages || isLoading} onClick={onNextPage}>
              Siguiente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
