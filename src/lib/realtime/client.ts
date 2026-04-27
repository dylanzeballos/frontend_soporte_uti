import type { ConnectionStatus, RealtimeEvent } from './types';
import { io, type Socket } from 'socket.io-client';

type EventHandler = (event: RealtimeEvent) => void;
type StatusHandler = (status: ConnectionStatus) => void;

export class RealtimeClient {
  private socket: Socket | null = null;
  private readonly url: string;
  private token: string | null = null;
  private readonly eventHandlers = new Set<EventHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private currentStatus: ConnectionStatus = 'disconnected';

  constructor(url: string) {
    this.url = url;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => void this.eventHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => void this.statusHandlers.delete(handler);
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.emitStatus('connecting');
    const socket = io(this.url, {
      auth: this.token ? { token: this.token } : undefined,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
    });

    this.socket = socket;

    socket.on('connect', () => {
      this.emitStatus('connected');
    });

    socket.io.on('reconnect_attempt', () => {
      this.emitStatus('retrying');
    });

    socket.on('disconnect', () => {
      this.emitStatus('disconnected');
    });

    socket.on('connect_error', () => {
      this.emitStatus('retrying');
    });

    socket.on('ticket:created', (payload: { ticketId: number; title: string }) => {
      const event: RealtimeEvent = {
        type: 'ticket.created',
        payload: {
          ticket: {
            id: payload.ticketId,
            title: payload.title,
            status: 'open',
            priority: 'medium',
            createdById: 0,
          },
        },
      };
      this.eventHandlers.forEach((h) => h(event));
    });

    socket.on(
      'ticket:assigned',
      (payload: { ticketId: number; title: string; assignedBy: number }) => {
        const event: RealtimeEvent = {
          type: 'ticket.assigned',
          payload: {
            ticket: {
              id: payload.ticketId,
              title: payload.title,
            },
            assignedTo: {
              id: payload.assignedBy,
              name: 'Asignado',
            },
          },
        };
        this.eventHandlers.forEach((h) => h(event));
      },
    );
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.emitStatus('disconnected');
  }

  private emitStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }
}
