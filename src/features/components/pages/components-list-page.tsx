import { Plus, Search, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComponentFormComponent } from '@/features/components/components/forms/ComponentFormComponent';
import { ComponentsTable } from '@/features/components/components/tables/ComponentsTable';
import { useComponentsAdmin } from '@/features/components/hooks/useComponentsAdmin';

export function ComponentsListPage() {
  const componentsAdmin = useComponentsAdmin();

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-panel)] border border-primary/10 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_45%),var(--card)] px-5 py-5 shadow-[var(--shadow-1)] sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-primary" />
              Inventario
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Componentes</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Gestión del catálogo de componentes disponibles para reportes de tickets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-10 px-3">
              Total: {componentsAdmin.total}
            </Badge>
            <Button onClick={componentsAdmin.startCreate} disabled={componentsAdmin.showForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo componente
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={componentsAdmin.search}
              onChange={(e) => componentsAdmin.setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {componentsAdmin.showForm ? (
          <ComponentFormComponent
            key={componentsAdmin.editingComponent?.id ?? 'new-component'}
            initialValues={componentsAdmin.formValues}
            mode={componentsAdmin.editingComponent ? 'edit' : 'create'}
            isSubmitting={componentsAdmin.isSaving}
            onSubmit={componentsAdmin.submitForm}
            onCancel={componentsAdmin.cancelForm}
          />
        ) : null}

        <ComponentsTable
          components={componentsAdmin.components}
          isLoading={componentsAdmin.isLoading}
          onEdit={componentsAdmin.startEdit}
          onDelete={componentsAdmin.deleteComponent}
        />
      </section>
    </div>
  );
}
