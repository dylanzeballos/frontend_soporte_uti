import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Component } from '@/features/components/schemas';

type ComponentsTableProps = {
  components: Component[];
  isLoading: boolean;
  onEdit: (component: Component) => void;
  onDelete: (component: Component) => void;
};

export function ComponentsTable({
  components,
  isLoading,
  onEdit,
  onDelete,
}: ComponentsTableProps) {
  if (components.length === 0) {
    return (
      <div className="rounded-lg bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay componentes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {components.map((component) => (
        <div
          key={component.id}
          className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{component.name}</h3>
              <Badge variant={component.isActive ? 'default' : 'secondary'}>
                {component.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {component.description && (
              <p className="text-sm text-muted-foreground">{component.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(component)}
              disabled={isLoading}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(component)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
