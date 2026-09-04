import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { RoleItem } from '@/hooks/useApi';
import { useRoles } from '@/hooks/useApi';

export function RolesListPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<RoleItem | null>(null);
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
      setSelectedRoleToDelete(null);
    },
  });

  const handleDelete = (role: RoleItem) => {
    setSelectedRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRoleToDelete) {
      deleteMutation.mutate(selectedRoleToDelete.id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lively-hero rounded-(--radius-panel) px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Administracion</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Lista de roles o cargos
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Revisa, edita y elimina los roles o cargos registrados.
          </p>
        </div>
      </section>

      <Card className="ticket-entry-card rounded-(--radius-panel)">
        <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
          <CardTitle className="text-xl">Roles y cargos registrados</CardTitle>
          <CardDescription className="leading-6">{roles.length} registros encontrados</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando roles...</div>
          ) : roles.length > 0 ? (
            <div className="space-y-1">
              {roles.map((role, index) => (
                <div
                  key={role.id}
                  className="rounded-[calc(var(--radius-panel)-0.35rem)] border border-border/60 bg-background/70 px-4 py-2 md:py-1 shadow-[0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                        <h3 className="truncate text-base font-normal text-foreground">{role.name}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                        aria-label={`Editar rol o cargo ${role.name}`}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(role)}
                        aria-label={`Eliminar rol o cargo ${role.name}`}
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
            <div className="py-8 text-center text-muted-foreground">No hay roles o cargos para mostrar</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar rol o cargo"
        description={`¿Estás seguro de que deseas eliminar el rol o cargo "${selectedRoleToDelete?.name}"? Esta acción no se puede deshacer.`}
        actionLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
