import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Unit } from '@/features/units/schemas';
import { useUnits } from '@/hooks/useApi';

export function UnitsListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { list, remove } = useUnits();

  const { data: units = [], isLoading } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: (result) => {
      if (!result) return;
      toast.success('Unidad eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  const handleDelete = (unit: Unit) => {
    const confirmed = confirm(`¿Seguro que deseas eliminar la unidad "${unit.name}"?`);
    if (!confirmed) return;

    deleteMutation.mutate(unit.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lista de unidades</h1>
        <p className="text-sm text-muted-foreground">
          Vista temporal con datos estáticos mientras se integra el backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidades registradas</CardTitle>
          <CardDescription>{units.length} unidades encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando unidades...</div>
          ) : units.length > 0 ? (
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
                  {units.map((unit) => (
                    <tr key={unit.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-muted-foreground">{unit.id}</td>
                      <td className="px-3 py-2">{unit.name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/units/${unit.id}/edit`)}
                            aria-label={`Editar unidad ${unit.id}`}
                          >
                            <Pencil data-icon="inline-start" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(unit)}
                            aria-label={`Eliminar unidad ${unit.id}`}
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
              No hay unidades para mostrar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
