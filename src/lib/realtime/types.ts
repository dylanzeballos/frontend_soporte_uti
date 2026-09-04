export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'retrying';

export type TicketCreatedEvent = {
  type: 'ticket.created';
  payload: {
    ticket: {
      id: number;
      title: string;
      status: string;
      priority: string;
      createdById: number;
    };
  };
};

export type TicketAssignedEvent = {
  type: 'ticket.assigned';
  payload: {
    ticket: { id: number; title: string };
    assignedTo: { id: number; name: string };
  };
};

export type TicketStatusChangedEvent = {
  type: 'ticket.status_changed';
  payload: {
    ticket: { id: number; title: string; status: string };
    oldStatus: string;
    newStatus: string;
  };
};

export type PingEvent = { type: 'ping'; payload: Record<string, never> };
export type PongEvent = { type: 'pong'; payload: Record<string, never> };

export type RealtimeEvent =
  | TicketCreatedEvent
  | TicketAssignedEvent
  | TicketStatusChangedEvent
  | PingEvent
  | PongEvent;

export type NotificationType = Exclude<RealtimeEvent['type'], 'ping' | 'pong'>;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  ticketId?: number;
  timestamp: Date;
  read: boolean;
}
