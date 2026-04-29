import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Component, CreateComponentInput, UpdateComponentInput, ComponentFormValues } from '@/features/components/schemas';
import {
  useComponentsQuery,
  useCreateComponentMutation,
  useUpdateComponentMutation,
  useDeleteComponentMutation,
} from '@/features/components/hooks';

export { type ComponentFormValues };

export const emptyComponentFormValues: ComponentFormValues = {
  name: '',
  description: '',
  isActive: true,
};

function toFormValues(component: Component | null): ComponentFormValues {
  if (!component) return emptyComponentFormValues;

  return {
    name: component.name ?? '',
    description: component.description ?? '',
    isActive: component.isActive ?? true,
  };
}

function toPayload(values: ComponentFormValues, mode: 'create' | 'edit'): CreateComponentInput | UpdateComponentInput {
  const base = {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    isActive: values.isActive,
  };

  if (mode === 'create') {
    return base as CreateComponentInput;
  }

  return base as UpdateComponentInput;
}

export function useComponentsAdmin() {
  const queryClient = useQueryClient();
  const componentsQuery = useComponentsQuery();
  const createMutation = useCreateComponentMutation();
  const updateMutation = useUpdateComponentMutation();
  const deleteMutation = useDeleteComponentMutation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);

  const filteredComponents = useMemo(() => {
    if (!search) return componentsQuery.data ?? [];
    return (componentsQuery.data ?? []).filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [componentsQuery.data, search]);

  const startCreate = () => {
    setEditingComponent(null);
    setShowForm(true);
  };

  const startEdit = (component: Component) => {
    setEditingComponent(component);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingComponent(null);
  };

  const submitForm = async (values: ComponentFormValues) => {
    try {
      const payload = toPayload(values, editingComponent ? 'edit' : 'create');

      if (editingComponent) {
        await updateMutation.mutateAsync({ id: editingComponent.id, data: payload as UpdateComponentInput });
        toast.success('Componente actualizado correctamente');
      } else {
        await createMutation.mutateAsync(payload as CreateComponentInput);
        toast.success('Componente creado correctamente');
      }

      cancelForm();
    } catch {
      // Error handling is done by the mutation
    }
  };

  const deleteComponent = async (component: Component) => {
    const confirmed = window.confirm(`Eliminar componente "${component.name}"?`);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(component.id);
      toast.success('Componente eliminado correctamente');
    } catch {
      // Error handling is done by the mutation
    }
  };

  return {
    components: filteredComponents,
    total: filteredComponents.length,
    page,
    setPage,
    search,
    setSearch,
    isLoading: componentsQuery.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    showForm,
    editingComponent,
    formValues: toFormValues(editingComponent),
    startCreate,
    startEdit,
    submitForm,
    cancelForm,
    deleteComponent,
  };
}
