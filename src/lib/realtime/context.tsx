import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-context';
import {
  invalidateTicketCaches,
  syncTicketStatusCaches,
} from '@/features/tickets/lib/ticket-cache';
import type { TicketStatus } from '@/features/tickets/schemas/ticket.schema';
import { RealtimeClient } from './client';
import type { AppNotification, ConnectionStatus, RealtimeEvent } from './types';

interface RealtimeContextValue {
  status: ConnectionStatus;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

const WS_URL = (import.meta.env.VITE_WS_URL ?? '') as string;
const MAX_NOTIFICATIONS = 50;

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    open: 'Abierto',
    in_progress: 'En progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
    cancelled: 'Cancelado',
  };
  return map[s] ?? s;
}

function buildNotification(event: RealtimeEvent): AppNotification | null {
  const id = `${event.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  switch (event.type) {
    case 'ticket.created':
      return {
        id, type: 'ticket.created', read: false, timestamp: new Date(),
        title: 'Nuevo ticket creado',
        description: event.payload.ticket.title,
        ticketId: event.payload.ticket.id,
      };
    case 'ticket.assigned':
      return {
        id, type: 'ticket.assigned', read: false, timestamp: new Date(),
        title: 'Ticket asignado',
        description: `"${event.payload.ticket.title}" -> ${event.payload.assignedTo.name}`,
        ticketId: event.payload.ticket.id,
      };
    case 'ticket.status_changed':
      return {
        id, type: 'ticket.status_changed', read: false, timestamp: new Date(),
        title: 'Estado actualizado',
        description: `"${event.payload.ticket.title}" -> ${statusLabel(event.payload.newStatus)}`,
        ticketId: event.payload.ticket.id,
      };
    default:
      return null;
  }
}

function startMockSimulation(onEvent: (e: RealtimeEvent) => void): () => void {
  let counter = 1;
  const agents = ['Agente Garcia', 'Soporte Nivel 2', 'Tecnico Rodriguez'];
  const statuses = ['in_progress', 'resolved', 'closed'] as const;
  const priorities = ['low', 'medium', 'high', 'urgent'] as const;

  function emit() {
    const r = Math.random();
    const id = 100 + counter++;
    if (r < 0.35) {
      onEvent({
        type: 'ticket.created',
        payload: {
          ticket: {
            id,
            title: `Solicitud de soporte #${id}`,
            status: 'open',
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            createdById: 1,
          },
        },
      });
    } else if (r < 0.65) {
      onEvent({
        type: 'ticket.assigned',
        payload: {
          ticket: { id, title: `Incidencia en servidor #${id}` },
          assignedTo: {
            id: 2,
            name: agents[Math.floor(Math.random() * agents.length)],
          },
        },
      });
    } else {
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      onEvent({
        type: 'ticket.status_changed',
        payload: {
          ticket: {
            id,
            title: `Ticket de mantenimiento #${id}`,
            status: newStatus,
          },
          oldStatus: 'open',
          newStatus,
        },
      });
    }
  }

  const first = setTimeout(emit, 6000);
  const interval = setInterval(emit, 18_000);
  return () => {
    clearTimeout(first);
    clearInterval(interval);
  };
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const clientRef = useRef<RealtimeClient | null>(null);

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      const notif = buildNotification(event);
      if (!notif) return;

      setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));

      switch (event.type) {
        case 'ticket.created':
          toast.info('Nuevo ticket creado', {
            description: event.payload.ticket.title,
          });
          break;
        case 'ticket.assigned':
          toast.info(`Asignado a ${event.payload.assignedTo.name}`, {
            description: event.payload.ticket.title,
          });
          break;
        case 'ticket.status_changed':
          syncTicketStatusCaches(queryClient, {
            ticketId: event.payload.ticket.id,
            title: event.payload.ticket.title,
            status: event.payload.newStatus as TicketStatus,
          });
          toast.info(`Estado: ${statusLabel(event.payload.newStatus)}`, {
            description: event.payload.ticket.title,
          });
          break;
      }

      invalidateTicketCaches(queryClient);
    },
    [queryClient],
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    // Avoid opening an unauthenticated socket; reconnect once login updates auth state.
    if (!isAuthenticated || !token) {
      queueMicrotask(() => setStatus('disconnected'));
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      return;
    }

    if (WS_URL) {
      const client = new RealtimeClient(WS_URL);
      client.setToken(token);
      clientRef.current = client;

      const offStatus = client.onStatus(setStatus);
      const offEvent = client.onEvent(handleEvent);
      client.connect();

      return () => {
        offStatus();
        offEvent();
        client.disconnect();
        clientRef.current = null;
      };
    }

    if (import.meta.env.DEV) {
      queueMicrotask(() => setStatus('connected'));
      const stop = startMockSimulation(handleEvent);
      return () => {
        stop();
        queueMicrotask(() => setStatus('disconnected'));
      };
    }
  }, [handleEvent, isAuthenticated]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{ status, notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
