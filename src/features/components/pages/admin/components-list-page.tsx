import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Archive, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import type { ComponentCatalogItem } from '@/features/reports/schemas';
import { useComponents } from '@/hooks/useApi';

export function ComponentsListPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentCatalogItem | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { list, remove } = useComponents();

  const { data: components = [], isLoading } = useQuery<ComponentCatalogItem[]>({
    queryKey: ['components'],
    queryFn: () => list({ page: 1, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Componente archivado correctamente');
      queryClient.invalidateQueries({ queryKey: ['components'] });
      setSelectedComponent(null);
    },
  });

  const handleArchive = (component: ComponentCatalogItem) => {
    setSelectedComponent(component);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedComponent) {
      deleteMutation.mutate(selectedComponent.id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lively-hero rounded-(--radius-panel) px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Administracion</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Lista de componentes
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Revisa, edita y archiva los componentes (repuestos, insumos) registrados.
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">Componentes registrados</CardTitle>
          <CardDescription className="leading-6">{components.length} componentes encontrados</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando componentes...</div>
          ) : components.length > 0 ? (
            <div className="space-y-1">
              {components.map((component, index) => (
                <div
                  key={component.id}
                  className="rounded-[calc(var(--radius-panel)-0.35rem)] border border-border/60 bg-background/70 px-4 py-2 md:py-1 shadow-[0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                        <h3 className="truncate text-base font-normal text-foreground">{component.name}</h3>
                        {component.isActive === false && (
                          <Badge variant="outline" className="text-xs">Archivado</Badge>
                        )}
                      </div>
                      {component.description && (
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/components/${component.id}/edit`)}
                        aria-label={`Editar componente ${component.name}`}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                      {component.isActive !== false && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleArchive(component)}
                          aria-label={`Archivar componente ${component.name}`}
                          disabled={deleteMutation.isPending}
                        >
                          <Archive data-icon="inline-start" />
                          Archivar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No hay componentes registrados. Crea uno desde "Registrar componente".
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archivar componente"
        description={`¿Estás seguro de que deseas archivar el componente "${selectedComponent?.name}"? Dejara de estar disponible para nuevos reportes.`}
        actionLabel="Archivar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
