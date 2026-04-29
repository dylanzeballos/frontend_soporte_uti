import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReportStats } from '@/features/reports/components/ReportStats';
import { apiRequest } from '@/lib/api';
import type { ReportStatsResponse } from '@/features/reports/schemas';

export function ReportsStatsPage() {
  const [stats, setStats] = useState<ReportStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const result = await apiRequest<ReportStatsResponse>({ url: `/reports/stats/summary${suffix}` });
      setStats(result);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-panel)] border border-primary/10 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_45%),var(--card)] px-5 py-5 shadow-[var(--shadow-1)] sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Analytics
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Estadísticas de Reportes
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Análisis de reportes, técnicos y componentes más utilizados.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date">Desde</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">Hasta</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={loadStats}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Filtrar
            </button>
          </div>
        </Card>

        <ReportStats data={stats} isLoading={isLoading} />
      </section>
    </div>
  );
}
