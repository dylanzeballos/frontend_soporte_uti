import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportStatsResponse } from '@/features/reports/schemas';

type ReportStatsProps = {
  data?: ReportStatsResponse | null;
  isLoading?: boolean;
};

export function ReportStats({ data, isLoading = false }: ReportStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-[var(--radius-panel)]">
            <CardContent className="pt-6">
              <div className="h-8 w-12 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay datos de estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de reportes</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalReports}</div>
            <p className="text-xs text-muted-foreground">Reportes creados</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estados</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.byStatus?.map((status) => (
                <div key={status.status} className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{status.status}</span>
                  <span className="font-semibold">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.byTechnician?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Técnicos con reportes</p>
          </CardContent>
        </Card>
      </div>

      {/* Technicians */}
      {data.byTechnician && data.byTechnician.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Reportes por técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byTechnician.map((tech) => (
                <div key={tech.userId} className="flex items-center justify-between">
                  <span className="text-sm">{tech.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-surface-low">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min((tech.count / (data.totalReports || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground w-8 text-right">
                      {tech.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Components */}
      {data.topComponents && data.topComponents.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Componentes más utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topComponents.map((component) => (
                <div key={component.componentId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{component.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {component.usageCount} uso{component.usageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{component.totalQuantity}</p>
                    <p className="text-xs text-muted-foreground">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
