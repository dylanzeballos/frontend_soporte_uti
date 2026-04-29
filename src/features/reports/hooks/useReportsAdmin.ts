import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { Report, CreateReportInput, UpdateReportInput, ReportFormValues } from '@/features/reports/schemas';
import {
  useCreateReportMutation,
  useDeleteReportMutation,
  useReportsQuery,
  useUpdateReportMutation,
} from '@/features/reports/hooks';
import { useComponentsQuery } from '@/features/components/hooks';

export { type ReportFormValues };

export const emptyReportFormValues: ReportFormValues = {
  ticketId: '',
  summary: '',
  workPerformed: '',
  resolutionType: '',
  startedAt: '',
  finishedAt: '',
  components: [],
};

function toFormValues(report: Report | null): ReportFormValues {
  if (!report) return emptyReportFormValues;

  return {
    ticketId: report.ticketId?.toString() ?? '',
    summary: report.summary ?? '',
    workPerformed: report.workPerformed ?? '',
    resolutionType: report.resolutionType ?? '',
    startedAt: report.startedAt ?? '',
    finishedAt: report.finishedAt ?? '',
    components: report.components ?? [],
  };
}

function toPayload(values: ReportFormValues, mode: 'create' | 'edit'): CreateReportInput | UpdateReportInput {
  const base = {
    ticketId: Number(values.ticketId),
    summary: values.summary.trim(),
    workPerformed: values.workPerformed?.trim() || undefined,
    resolutionType: values.resolutionType?.trim() || undefined,
    startedAt: values.startedAt || undefined,
    finishedAt: values.finishedAt || undefined,
    components: values.components,
  };

  if (mode === 'create') {
    return base as CreateReportInput;
  }

  return base as UpdateReportInput;
}

export function useReportsAdmin() {
  const reportsQuery = useReportsQuery();
  const componentsQuery = useComponentsQuery();
  const createMutation = useCreateReportMutation();
  const updateMutation = useUpdateReportMutation();
  const deleteMutation = useDeleteReportMutation();

  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const startCreate = useCallback(async () => {
    await componentsQuery.refetch();
    setEditingReport(null);
    setShowForm(true);
  }, [componentsQuery]);

  const startEdit = useCallback(async (report: Report) => {
    await componentsQuery.refetch();
    setEditingReport(report);
    setShowForm(true);
  }, [componentsQuery]);

  const cancelForm = () => {
    setShowForm(false);
    setEditingReport(null);
  };

  const submitForm = async (values: ReportFormValues) => {
    try {
      const payload = toPayload(values, editingReport ? 'edit' : 'create');

      if (editingReport) {
        await updateMutation.mutateAsync({ id: editingReport.id, data: payload as UpdateReportInput });
        toast.success('Reporte actualizado correctamente');
      } else {
        await createMutation.mutateAsync(payload as CreateReportInput);
        toast.success('Reporte creado correctamente');
      }

      cancelForm();
    } catch {
      // Error handled by api interceptor
    }
  };

  const deleteReport = async (report: Report) => {
    const confirmed = window.confirm(`Eliminar reporte #${report.id}?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(report.id);
      toast.success('Reporte eliminado correctamente');
    } catch {
      // Error handled by api interceptor
    }
  };

  return {
    reports: reportsQuery.data ?? [],
    total: (reportsQuery.data ?? []).length,
    page,
    setPage,
    isLoading: reportsQuery.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    showForm,
    editingReport,
    formValues: toFormValues(editingReport),
    availableComponents: componentsQuery.data ?? [],
    startCreate,
    startEdit,
    submitForm,
    cancelForm,
    deleteReport,
  };
}
