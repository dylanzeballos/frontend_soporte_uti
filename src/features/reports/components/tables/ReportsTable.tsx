import { Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Report } from '@/features/reports/schemas';

type ReportsTableProps = {
  reports: Report[];
  isLoading: boolean;
  onEdit: (report: Report) => void;
  onDelete: (report: Report) => void;
  onView?: (report: Report) => void;
};

export function ReportsTable({
  reports,
  isLoading,
  onEdit,
  onDelete,
  onView,
}: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay reportes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Ticket #{report.ticketId}</h3>
              <Badge variant="outline">{report.id}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
            {report.components && report.components.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {report.components.length} componente{report.components.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {report.resolutionType && (
              <Badge variant="secondary" className="capitalize">
                {report.resolutionType}
              </Badge>
            )}
            <div className="flex gap-2">
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(report)}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(report)}
                disabled={isLoading}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(report)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
