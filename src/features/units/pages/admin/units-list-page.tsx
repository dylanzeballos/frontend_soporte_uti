import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { staticUnits, type UnitItem } from '@/features/units/data/static-units';

export function UnitsListPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitItem[]>(staticUnits);

  const handleDelete = (unit: UnitItem) => {
    const confirmed = confirm(`¿Seguro que deseas eliminar la unidad "${unit.name}"?`);
    if (!confirmed) return;

    setUnits((prev) => prev.filter((item) => item.id !== unit.id));
    toast.success('Unidad eliminada correctamente');
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
        </CardContent>
      </Card>
    </div>
  );
}
