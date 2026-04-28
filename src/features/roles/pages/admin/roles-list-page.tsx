import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoleItem } from '@/hooks/useApi';
import { useRoles } from '@/hooks/useApi';

export function RolesListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { list, remove } = useRoles();

  const { data: roles = [], isLoading } = useQuery<RoleItem[]>({
    queryKey: ['roles'],
    queryFn: list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: (result) => {
      if (!result) return;
      toast.success('Rol o cargo eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const handleDelete = (role: RoleItem) => {
    const confirmed = confirm(`¿Seguro que deseas eliminar el rol o cargo "${role.name}"?`);
    if (!confirmed) return;

    deleteMutation.mutate(role.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lista de roles o cargos</h1>
        <p className="text-sm text-muted-foreground">Roles y cargos registrados en el sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles y cargos registrados</CardTitle>
          <CardDescription>{roles.length} registros encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando roles...</div>
          ) : roles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-semibold text-foreground">ID</th>
                    <th className="px-3 py-2 font-semibold text-foreground">Nombre</th>
                    <th className="px-3 py-2 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-muted-foreground">{role.id}</td>
                      <td className="px-3 py-2">{role.name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                            aria-label={`Editar rol o cargo ${role.id}`}
                          >
                            <Pencil data-icon="inline-start" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(role)}
                            aria-label={`Eliminar rol o cargo ${role.id}`}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 data-icon="inline-start" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No hay roles o cargos para mostrar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
