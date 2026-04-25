import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { useUnits } from '@/hooks/useApi';
import type { UnitItem } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UnitsAdminPage() {
  const queryClient = useQueryClient();
  const { list, create, remove } = useUnits();

  const { data: units = [], isLoading } = useQuery<UnitItem[]>({
    queryKey: ['units'],
    queryFn: list,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Unidad creada correctamente');
      setShowCreate(false);
      setNewUnit({ name: '', description: '' });
      void queryClient.invalidateQueries({ queryKey: ['units'] });
    },
    onError: () => toast.error('No se pudo crear la unidad'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Unidad eliminada');
      void queryClient.invalidateQueries({ queryKey: ['units'] });
    },
    onError: () => toast.error('No se pudo eliminar la unidad'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: '', description: '' });

  const handleCreate = () => {
    if (!newUnit.name.trim()) {
      toast.error('El nombre de la unidad es requerido');
      return;
    }
    createMutation.mutate(newUnit);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`¿Eliminar la unidad "${name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <section className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
        <div className="editorial-kicker">
          <Building2 className="h-3.5 w-3.5" />
          Administración
        </div>
        <h1 className="mt-5 text-[clamp(1.8rem,2.9vw,2.8rem)] font-bold tracking-[-0.02em] text-foreground">
          Gestionar unidades
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Administra las unidades o departamentos de la organización.
        </p>
      </section>

      <div className="flex items-center justify-between">
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva unidad
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Crear unidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="unit-name">Nombre *</Label>
                <Input
                  id="unit-name"
                  placeholder="Ej: Dirección de Informática"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-desc">Descripción</Label>
                <Input
                  id="unit-desc"
                  placeholder="Descripción opcional"
                  value={newUnit.description}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando…' : 'Crear'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setNewUnit({ name: '', description: '' });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="editorial-inset rounded-md py-12 text-center text-muted-foreground">
          Cargando unidades…
        </div>
      ) : units.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Unidades ({units.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-foreground/6">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{unit.name}</div>
                      {unit.description && (
                        <div className="text-sm text-muted-foreground">
                          {unit.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unit.isActive !== undefined && (
                      <Badge variant={unit.isActive ? 'default' : 'outline'}>
                        {unit.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Eliminar unidad ${unit.name}`}
                      onClick={() => handleDelete(unit.id, unit.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Building2
              className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="font-medium text-foreground">Sin unidades registradas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera unidad con el botón de arriba.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
