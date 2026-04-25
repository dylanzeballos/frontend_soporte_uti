import type { ConnectionStatus, RealtimeEvent } from './types';

type EventHandler = (event: RealtimeEvent) => void;
type StatusHandler = (status: ConnectionStatus) => void;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private token: string | null = null;
  private retryCount = 0;
  private readonly maxRetries = 10;
  private readonly baseDelay = 1000;
  private readonly maxDelay = 30_000;
  private heartbeatId: ReturnType<typeof setInterval> | null = null;
  private reconnectId: ReturnType<typeof setTimeout> | null = null;
  private readonly eventHandlers = new Set<EventHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private currentStatus: ConnectionStatus = 'disconnected';
  private shouldReconnect = false;

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
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldReconnect = true;
    this.retryCount = 0;
    this.doConnect();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimers();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.emitStatus('disconnected');
  }

  private doConnect(): void {
    this.emitStatus('connecting');
    const url = this.token
      ? `${this.url}?token=${encodeURIComponent(this.token)}`
      : this.url;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.emitStatus('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev: MessageEvent<string>) => {
      try {
        const event = JSON.parse(ev.data) as RealtimeEvent;
        if (event.type === 'pong' || event.type === 'ping') return;
        this.eventHandlers.forEach((h) => h(event));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = (ev) => {
      this.stopHeartbeat();
      this.ws = null;
      if (!this.shouldReconnect || ev.code === 1000) {
        this.emitStatus('disconnected');
      } else {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose fires after onerror — reconnect handled there
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.retryCount >= this.maxRetries) {
      this.emitStatus('disconnected');
      return;
    }
    this.emitStatus('retrying');
    const delay = Math.min(this.baseDelay * 2 ** this.retryCount, this.maxDelay);
    this.retryCount++;
    this.reconnectId = setTimeout(() => this.doConnect(), delay);
  }

  private startHeartbeat(): void {
    this.heartbeatId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', payload: {} }));
      }
    }, 30_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatId !== null) {
      clearInterval(this.heartbeatId);
      this.heartbeatId = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectId !== null) {
      clearTimeout(this.reconnectId);
      this.reconnectId = null;
    }
  }

  private emitStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  getStatus(): ConnectionStatus {
    return this.currentStatus;
  }
}
