import { Plus, Search, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReportFormComponent } from '@/features/reports/components/forms/ReportFormComponent';
import { ReportsTable } from '@/features/reports/components/tables/ReportsTable';
import { useReportsAdmin } from '@/features/reports/hooks/useReportsAdmin';

export function ReportsListPage() {
  const reportsAdmin = useReportsAdmin();

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-panel)] border border-primary/10 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_45%),var(--card)] px-5 py-5 shadow-[var(--shadow-1)] sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Gestión técnica
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Reportes de Tickets</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Documentación de trabajos realizados, componentes utilizados y resoluciones de tickets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-10 px-3">
              Total: {reportsAdmin.total}
            </Badge>
            <Button onClick={reportsAdmin.startCreate} disabled={reportsAdmin.showForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo reporte
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar reportes..." className="pl-9" />
          </div>
        </div>

        {reportsAdmin.showForm ? (
          <ReportFormComponent
            key={reportsAdmin.editingReport?.id ?? 'new-report'}
            initialValues={reportsAdmin.formValues}
            mode={reportsAdmin.editingReport ? 'edit' : 'create'}
            availableComponents={reportsAdmin.availableComponents}
            isSubmitting={reportsAdmin.isSaving}
            onSubmit={reportsAdmin.submitForm}
            onCancel={reportsAdmin.cancelForm}
          />
        ) : null}

        <ReportsTable
          reports={reportsAdmin.reports}
          isLoading={reportsAdmin.isLoading}
          onEdit={reportsAdmin.startEdit}
          onDelete={reportsAdmin.deleteReport}
        />
      </section>
    </div>
  );
}
