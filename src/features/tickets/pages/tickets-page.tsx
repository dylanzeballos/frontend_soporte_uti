import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useTickets } from '@/hooks/useApi';
import type { Ticket, TicketPriority } from '@/features/tickets/schemas/ticket.schema';
import { getStatusLabel, getPriorityLabel } from '@/features/tickets/schemas/ticket.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TicketsPage() {
  const queryClient = useQueryClient();
  const { list, create } = useTickets();

  const { data: tickets = [], isLoading: loading } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: list,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Ticket creado correctamente');
      setShowCreate(false);
      setNewTicket({ title: '', description: '', priority: 'medium' });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' as TicketPriority });
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const handleCreate = () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    createMutation.mutate(newTicket);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título del ticket"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            />
            <Input
              placeholder="Descripción"
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />
            <Select
              value={newTicket.priority || 'medium'}
              onValueChange={(v) => setNewTicket({ ...newTicket, priority: v || 'medium' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                Crear
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Input placeholder="Buscar tickets..." className="max-w-xs" />
        <Select value={filters.status || ''} onValueChange={(v) => setFilters({ ...filters, status: v || '' })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abierto</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="resolved">Resuelto</SelectItem>
            <SelectItem value="closed">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando tickets...</div>
      ) : tickets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket: Ticket) => (
            <Card key={ticket.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{String(ticket.title || 'Sin título')}</CardTitle>
                  <Badge variant="secondary">{getPriorityLabel(ticket.priority)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {String(ticket.description || 'Sin descripción')}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{getStatusLabel(ticket.status)}</span>
                  <span>{ticket.createdAt ? new Date(String(ticket.createdAt)).toLocaleDateString() : ''}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay tickets para mostrar
        </div>
      )}
    </div>
  );
}