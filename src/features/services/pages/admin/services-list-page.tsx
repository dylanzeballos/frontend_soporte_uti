import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { staticServices, type ServiceItem } from '@/features/services/data/static-services';

export function ServicesListPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>(staticServices);

  const handleDelete = (service: ServiceItem) => {
    const confirmed = confirm(`¿Seguro que deseas eliminar el servicio "${service.name}"?`);
    if (!confirmed) return;

    setServices((prev) => prev.filter((item) => item.id !== service.id));
    toast.success('Servicio eliminado correctamente');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lista de servicios</h1>
        <p className="text-sm text-muted-foreground">
          Vista temporal con datos estáticos mientras se integra el backend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios registrados</CardTitle>
          <CardDescription>{services.length} servicios encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {services.length > 0 ? (
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
                  {services.map((service) => (
                    <tr key={service.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-muted-foreground">{service.id}</td>
                      <td className="px-3 py-2">{service.name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/services/${service.id}/edit`)}
                            aria-label={`Editar servicio ${service.id}`}
                          >
                            <Pencil data-icon="inline-start" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(service)}
                            aria-label={`Eliminar servicio ${service.id}`}
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
              No hay servicios para mostrar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
