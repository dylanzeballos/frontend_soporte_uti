import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Wrench } from 'lucide-react';
import { useAdminServices } from '@/hooks/useApi';
import type { ServiceItem } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ServicesAdminPage() {
  const queryClient = useQueryClient();
  const { list, create, remove } = useAdminServices();

  const { data: services = [], isLoading } = useQuery<ServiceItem[]>({
    queryKey: ['services-admin'],
    queryFn: list,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Servicio creado correctamente');
      setShowCreate(false);
      setNewService({ name: '' });
      void queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => toast.error('No se pudo crear el servicio'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Servicio eliminado');
      void queryClient.invalidateQueries({ queryKey: ['services-admin'] });
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => toast.error('No se pudo eliminar el servicio'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newService, setNewService] = useState({ name: '' });

  const handleCreate = () => {
    if (!newService.name.trim()) {
      toast.error('El nombre del servicio es requerido');
      return;
    }
    createMutation.mutate(newService);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`¿Eliminar el servicio "${name}"? Los tickets asociados no se verán afectados.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <section className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
        <div className="editorial-kicker">
          <Wrench className="h-3.5 w-3.5" />
          Administración
        </div>
        <h1 className="mt-5 text-[clamp(1.8rem,2.9vw,2.8rem)] font-bold tracking-[-0.02em] text-foreground">
          Gestionar servicios
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Administra los servicios disponibles para categorizar los tickets de soporte.
        </p>
      </section>

      <div className="flex items-center justify-between">
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo servicio
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Crear servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="service-name">Nombre del servicio *</Label>
              <Input
                id="service-name"
                placeholder="Ej: Soporte técnico de red"
                value={newService.name}
                onChange={(e) => setNewService({ name: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando…' : 'Crear'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreate(false);
                  setNewService({ name: '' });
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
          Cargando servicios…
        </div>
      ) : services.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Servicios ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-foreground/6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Wrench className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="font-medium text-foreground">{service.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.isActive !== undefined && (
                      <Badge variant={service.isActive ? 'default' : 'outline'}>
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Eliminar servicio ${service.name}`}
                      onClick={() => handleDelete(service.id, service.name)}
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
            <Wrench
              className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="font-medium text-foreground">Sin servicios registrados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer servicio con el botón de arriba.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
