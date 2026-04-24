import { useMemo, useState, type DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Priority = "alta" | "media" | "baja";
type BoardView = "board" | "list" | "table";

type KanbanTicket = {
  id: string;
  title: string;
  description: string;
  area: string;
  assignedTo: string;
  priority: Priority;
  progress: number;
  comments: number;
  attachments: number;
};

type KanbanColumn = {
  key: string;
  title: string;
  tickets: KanbanTicket[];
};

const initialColumns: KanbanColumn[] = [
  {
    key: "backlog",
    title: "Pendiente",
    tickets: [
      {
        id: "UTI-201",
        title: "Falla de encendido en laboratorio 3",
        description: "Tres equipos no inician despues de corte electrico.",
        area: "Laboratorios FCE",
        assignedTo: "Equipo Hardware",
        priority: "alta",
        progress: 10,
        comments: 2,
        attachments: 1,
      },
      {
        id: "UTI-202",
        title: "Reinstalacion de Office en Decanato",
        description: "Solicitan instalacion limpia por errores de licencia.",
        area: "Decanato",
        assignedTo: "Mesa de Ayuda",
        priority: "media",
        progress: 0,
        comments: 1,
        attachments: 0,
      },
    ],
  },
  {
    key: "in_progress",
    title: "En Proceso",
    tickets: [
      {
        id: "UTI-180",
        title: "Cableado de red inestable en piso 2",
        description: "Intermitencia en puertos de secretaria administrativa.",
        area: "Administracion FCE",
        assignedTo: "Infraestructura",
        priority: "alta",
        progress: 55,
        comments: 4,
        attachments: 2,
      },
      {
        id: "UTI-183",
        title: "Migracion de impresora a servidor nuevo",
        description: "Cola de impresion se detiene en horas pico.",
        area: "Contabilidad",
        assignedTo: "Soporte Sistemas",
        priority: "media",
        progress: 40,
        comments: 3,
        attachments: 1,
      },
    ],
  },
  {
    key: "qa",
    title: "Validacion",
    tickets: [
      {
        id: "UTI-171",
        title: "Recuperacion de cuentas institucionales",
        description: "Validar acceso de 12 docentes en dominio interno.",
        area: "Direccion Academica",
        assignedTo: "Seguridad TI",
        priority: "baja",
        progress: 85,
        comments: 1,
        attachments: 0,
      },
    ],
  },
  {
    key: "done",
    title: "Resuelto",
    tickets: [
      {
        id: "UTI-160",
        title: "Actualizacion antivirus centralizado",
        description: "Endpoints de biblioteca sincronizados correctamente.",
        area: "Biblioteca",
        assignedTo: "Soporte Sistemas",
        priority: "media",
        progress: 100,
        comments: 2,
        attachments: 3,
      },
    ],
  },
];

function priorityClass(priority: Priority) {
  if (priority === "alta") {
    return "bg-destructive/15 text-destructive border-destructive/20";
  }
  if (priority === "media") {
    return "bg-amber-500/15 text-amber-700 border-amber-500/20 dark:text-amber-400";
  }
  return "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
}

export function KanbanPage() {
  const [view, setView] = useState<BoardView>("board");
  const [boardColumns, setBoardColumns] = useState<KanbanColumn[]>(initialColumns);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragFromColumnKey, setDragFromColumnKey] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);

  const totalTickets = useMemo(
    () => boardColumns.reduce((sum, col) => sum + col.tickets.length, 0),
    [boardColumns]
  );

  function onCardDragStart(event: DragEvent<HTMLDivElement>, columnKey: string, ticketId: string) {
    setDraggedTicketId(ticketId);
    setDragFromColumnKey(columnKey);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ticketId);
  }

  function onColumnDragOver(event: DragEvent<HTMLElement>, columnKey: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverColumnKey !== columnKey) {
      setDragOverColumnKey(columnKey);
    }
  }

  function resetDragState() {
    setDraggedTicketId(null);
    setDragFromColumnKey(null);
    setDragOverColumnKey(null);
  }

  function onColumnDrop(event: DragEvent<HTMLElement>, targetColumnKey: string) {
    event.preventDefault();

    const ticketId = draggedTicketId ?? event.dataTransfer.getData("text/plain");
    const sourceColumnKey = dragFromColumnKey;

    if (!ticketId || !sourceColumnKey || sourceColumnKey === targetColumnKey) {
      resetDragState();
      return;
    }

    setBoardColumns((prev) => {
      const sourceColumn = prev.find((column) => column.key === sourceColumnKey);
      const targetColumn = prev.find((column) => column.key === targetColumnKey);

      if (!sourceColumn || !targetColumn) return prev;

      const movedTicket = sourceColumn.tickets.find((ticket) => ticket.id === ticketId);
      if (!movedTicket) return prev;

      return prev.map((column) => {
        if (column.key === sourceColumnKey) {
          return {
            ...column,
            tickets: column.tickets.filter((ticket) => ticket.id !== ticketId),
          };
        }
        if (column.key === targetColumnKey) {
          return {
            ...column,
            tickets: [...column.tickets, movedTicket],
          };
        }
        return column;
      });
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
              Seguimiento de solicitudes de soporte tecnico para equipos FCE-UMSS.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalTickets} tickets</Badge>
            <div className="flex rounded-md border bg-muted/40 p-1">
              <Button
                type="button"
                size="sm"
                variant={view === "board" ? "default" : "ghost"}
                onClick={() => setView("board")}
              >
                Board
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                onClick={() => setView("list")}
              >
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "table" ? "default" : "ghost"}
                onClick={() => setView("table")}
              >
                Table
              </Button>
            </div>
          </div>
        </div>
      </header>

      {view === "board" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {boardColumns.map((column) => (
            <article
              key={column.key}
              className={cn(
                "flex min-h-[420px] flex-col rounded-xl border bg-muted/20 transition-colors",
                dragOverColumnKey === column.key && "border-primary/60 bg-primary/5"
              )}
              onDragOver={(event) => onColumnDragOver(event, column.key)}
              onDrop={(event) => onColumnDrop(event, column.key)}
              onDragLeave={() => setDragOverColumnKey(null)}
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
                    className={cn(
                      "cursor-grab shadow-sm active:cursor-grabbing",
                      draggedTicketId === ticket.id && "opacity-60"
                    )}
                    draggable
                    onDragStart={(event) => onCardDragStart(event, column.key, ticket.id)}
                    onDragEnd={resetDragState}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-5">{ticket.title}</CardTitle>
                        <Badge className={cn("border", priorityClass(ticket.priority))}>
                          {ticket.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 text-xs">
                      <p className="text-muted-foreground">{ticket.description}</p>
                      <p>
                        <span className="font-medium">ID:</span> {ticket.id}
                      </p>
                      <p>
                        <span className="font-medium">Area:</span> {ticket.area}
                      </p>
                      <p>
                        <span className="font-medium">Asignado:</span> {ticket.assignedTo}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Progreso</span>
                          <span>{ticket.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${ticket.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Comentarios: {ticket.comments}</span>
                        <span>Adjuntos: {ticket.attachments}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="space-y-3">
          {boardColumns.map((column) => (
            <Card key={column.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {column.title} ({column.tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {column.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.id} · {ticket.area} · {ticket.assignedTo}
                      </p>
                    </div>
                    <Badge className={cn("border", priorityClass(ticket.priority))}>
                      {ticket.priority}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {view === "table" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tabla de tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">ID</th>
                    <th className="p-2">Titulo</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2">Area</th>
                    <th className="p-2">Asignado</th>
                    <th className="p-2">Prioridad</th>
                    <th className="p-2">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {boardColumns.flatMap((column) =>
                    column.tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">{ticket.id}</td>
                        <td className="p-2">{ticket.title}</td>
                        <td className="p-2">{column.title}</td>
                        <td className="p-2">{ticket.area}</td>
                        <td className="p-2">{ticket.assignedTo}</td>
                        <td className="p-2">
                          <Badge className={cn("border", priorityClass(ticket.priority))}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="p-2">{ticket.progress}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
