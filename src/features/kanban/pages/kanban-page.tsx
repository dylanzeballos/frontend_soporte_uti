import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTickets } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/features/tickets/schemas/ticket.schema";

type BoardView = "board" | "list" | "table";
type PriorityFilter = "all" | TicketPriority;

const STATUS_COLUMNS: TicketStatus[] = ["open", "in_progress", "resolved", "closed", "cancelled"];

function getAssigneeName(ticket: Ticket): string {
  if (!ticket.assignedTo) return "Sin asignar";
  const first = ticket.assignedTo.firstName ?? "";
  const last = ticket.assignedTo.lastName ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName || ticket.assignedTo.name || ticket.assignedTo.email;
}

function normalizeStatus(value: string | undefined): TicketStatus {
  const normalized = (value ?? "").toLowerCase().trim();
  if (normalized === "open" || normalized === "in_progress" || normalized === "resolved" || normalized === "closed" || normalized === "cancelled") {
    return normalized;
  }
  return "open";
}

function normalizePriority(value: string | undefined): TicketPriority {
  const normalized = (value ?? "").toLowerCase().trim();
  if (normalized === "low" || normalized === "medium" || normalized === "high" || normalized === "urgent") {
    return normalized;
  }
  return "medium";
}

export function KanbanPage() {
  const queryClient = useQueryClient();
  const { list, updateStatus } = useTickets();

  const [view, setView] = useState<BoardView>("board");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [boardTickets, setBoardTickets] = useState<Ticket[]>([]);
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
  const [dragFromStatus, setDragFromStatus] = useState<TicketStatus | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TicketStatus | null>(null);

  const { data: tickets = [], isLoading, isFetching } = useQuery<Ticket[]>({
    queryKey: ["kanban-tickets", search, priorityFilter],
    queryFn: () =>
      list({
        page: 1,
        limit: 20,
        search: search || undefined,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
      }),
  });

  useEffect(() => {
    setBoardTickets(
      tickets.map((ticket) => ({
        ...ticket,
        status: normalizeStatus(ticket.status),
        priority: normalizePriority(ticket.priority),
      }))
    );
  }, [tickets]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: number; status: TicketStatus; comment?: string }) =>
      updateStatus(id, { status, comment }),
    onMutate: async ({ id, status }) => {
      let previous: Ticket[] = [];
      setBoardTickets((current) => {
        previous = current;
        return current.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                status,
                updatedAt: new Date().toISOString(),
              }
            : ticket
        );
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        setBoardTickets(context.previous);
      }
      toast.error("No se pudo mover el ticket. Se revirtió el cambio.");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kanban-tickets"] });
    },
  });

  const columns = useMemo(
    () =>
      STATUS_COLUMNS.map((status) => ({
        key: status,
        title: getStatusLabel(status),
        tickets: boardTickets.filter((ticket) => ticket.status === status),
      })),
    [boardTickets]
  );

  const totalTickets = boardTickets.length;

  function onCardDragStart(event: DragEvent<HTMLDivElement>, ticketId: number, sourceStatus: TicketStatus) {
    setDraggedTicketId(ticketId);
    setDragFromStatus(sourceStatus);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(ticketId));
  }

  function onColumnDragOver(event: DragEvent<HTMLElement>, status: TicketStatus) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  }

  function resetDragState() {
    setDraggedTicketId(null);
    setDragFromStatus(null);
    setDragOverStatus(null);
  }

  function onColumnDrop(event: DragEvent<HTMLElement>, targetStatus: TicketStatus) {
    event.preventDefault();
    const ticketId = draggedTicketId ?? Number(event.dataTransfer.getData("text/plain"));
    const sourceStatus = dragFromStatus;

    if (!ticketId || !sourceStatus || sourceStatus === targetStatus) {
      resetDragState();
      return;
    }

    statusMutation.mutate({
      id: ticketId,
      status: targetStatus,
      comment: `Movimiento desde ${getStatusLabel(sourceStatus)} a ${getStatusLabel(targetStatus)} desde Kanban`,
    });

    resetDragState();
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold sm:text-lg">Tablero Kanban UTI</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Tickets reales desde API. Arrastra tarjetas entre columnas para cambiar estado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalTickets} tickets</Badge>
            <div className="flex rounded-md border bg-muted/40 p-1">
              <Button type="button" size="sm" variant={view === "board" ? "default" : "ghost"} onClick={() => setView("board")}>
                Board
              </Button>
              <Button type="button" size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>
                List
              </Button>
              <Button type="button" size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")}>
                Table
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Buscar por titulo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Cargando tickets...</CardContent>
        </Card>
      ) : null}

      {view === "board" && !isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((column) => (
            <article
              key={column.key}
              className={cn(
                "flex min-h-[420px] flex-col rounded-xl border bg-muted/20 transition-colors",
                dragOverStatus === column.key && "border-primary/60 bg-primary/5"
              )}
              onDragOver={(event) => onColumnDragOver(event, column.key)}
              onDrop={(event) => onColumnDrop(event, column.key)}
              onDragLeave={() => setDragOverStatus(null)}
            >
              <div className="border-b p-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{column.title}</h2>
                  <Badge variant="outline">{column.tickets.length}</Badge>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {column.tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={cn("cursor-grab shadow-sm active:cursor-grabbing", draggedTicketId === ticket.id && "opacity-60")}
                    draggable
                    onDragStart={(event) => onCardDragStart(event, ticket.id, column.key)}
                    onDragEnd={resetDragState}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-5">{ticket.title}</CardTitle>
                        <Badge className={cn("border", getPriorityColor(ticket.priority))}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 text-xs">
                      <p className="line-clamp-3 text-muted-foreground">{ticket.description}</p>
                      <p>
                        <span className="font-medium">ID:</span> #{ticket.id}
                      </p>
                      <p>
                        <span className="font-medium">Asignado:</span> {getAssigneeName(ticket)}
                      </p>
                      <p>
                        <span className="font-medium">Actualizado:</span>{" "}
                        {new Date(ticket.updatedAt).toLocaleString("es-BO")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {column.tickets.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Sin tickets
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {view === "list" && !isLoading && (
        <div className="space-y-3">
          {columns.map((column) => (
            <Card key={column.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {column.title} ({column.tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {column.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{ticket.id} · {getAssigneeName(ticket)}
                      </p>
                    </div>
                    <Badge className={cn("border", getPriorityColor(ticket.priority))}>{getPriorityLabel(ticket.priority)}</Badge>
                  </div>
                ))}
                {column.tickets.length === 0 ? <p className="text-sm text-muted-foreground">Sin tickets</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {view === "table" && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tabla de tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Asignado</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boardTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge className={cn("border", getStatusColor(ticket.status))}>{getStatusLabel(ticket.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", getPriorityColor(ticket.priority))}>{getPriorityLabel(ticket.priority)}</Badge>
                    </TableCell>
                    <TableCell>{getAssigneeName(ticket)}</TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleDateString("es-BO")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isFetching && !isLoading ? (
        <p className="text-xs text-muted-foreground">Actualizando tablero...</p>
      ) : null}
    </section>
  );
}
