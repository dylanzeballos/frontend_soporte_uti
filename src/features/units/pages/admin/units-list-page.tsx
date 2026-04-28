import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Unit } from '@/features/units/schemas';
import { useUnits } from '@/hooks/useApi';

export function UnitsListPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUnitToDelete, setSelectedUnitToDelete] = useState<Unit | null>(null);
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
      setSelectedUnitToDelete(null);
    },
  });

  const handleDelete = (unit: Unit) => {
    setSelectedUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUnitToDelete) {
      deleteMutation.mutate(selectedUnitToDelete.id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lively-hero rounded-(--radius-panel) px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Administracion</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Lista de unidades
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Revisa, edita y elimina las unidades registradas.
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">Unidades registradas</CardTitle>
          <CardDescription className="leading-6">{units.length} unidades encontradas</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando unidades...</div>
          ) : units.length > 0 ? (
            <div className="space-y-3">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-[calc(var(--radius-panel)-0.35rem)] border border-border/60 bg-background/70 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          ID {unit.id}
                        </span>
                        <h3 className="truncate text-base font-semibold text-foreground">{unit.name}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No hay unidades para mostrar</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar unidad"
        description={`¿Estás seguro de que deseas eliminar la unidad "${selectedUnitToDelete?.name}"? Esta acción no se puede deshacer.`}
        actionLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
