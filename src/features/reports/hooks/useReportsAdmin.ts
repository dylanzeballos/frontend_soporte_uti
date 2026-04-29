import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Report, CreateReportInput, UpdateReportInput, ReportFormValues } from '@/features/reports/schemas';
import { useReportsQuery } from '@/features/reports/hooks';
import { useComponentsQuery } from '@/features/components/hooks';
import { apiRequest } from '@/lib/api';

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
    workPerformed: values.workPerformed.trim() || undefined,
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
  const queryClient = useQueryClient();
  const reportsQuery = useReportsQuery();
  const componentsQuery = useComponentsQuery();

  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    try {
      const payload = toPayload(values, editingReport ? 'edit' : 'create');

      if (editingReport) {
        await apiRequest<Report>({ url: `/reports/${editingReport.id}`, method: 'PATCH', data: payload });
        toast.success('Reporte actualizado correctamente');
      } else {
        await apiRequest<Report>({ url: '/reports', method: 'POST', data: payload });
        toast.success('Reporte creado correctamente');
      }

      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      cancelForm();
    } catch {
      // Error handled by api interceptor
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReport = async (report: Report) => {
    const confirmed = window.confirm(`Eliminar reporte #${report.id}?`);
    if (!confirmed) return;

    try {
      await apiRequest<null>({ url: `/reports/${report.id}`, method: 'DELETE' });
      toast.success('Reporte eliminado correctamente');
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
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
    isSaving,
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
