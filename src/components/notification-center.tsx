import { useEffect, useRef, useState } from 'react';
import {
  BellIcon,
  CheckCheckIcon,
  CircleDotIcon,
  TicketIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '@/lib/realtime/context';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/realtime/types';

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'ahora';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    onRead(notification.id);
    if (notification.ticketId) {
      navigate('/tickets');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !notification.read && 'bg-primary/5',
      )}
    >
      <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5 text-primary">
        <TicketIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <span
            className={cn(
              'leading-snug text-foreground',
              notification.read ? 'font-medium' : 'font-semibold',
            )}
          >
            {notification.title}
          </span>
          {!notification.read && (
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="Sin leer"
            />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.description}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
    </button>
  );
}

const statusDotClass: Record<string, string> = {
  connected: 'bg-success',
  connecting: 'bg-warning animate-pulse',
  retrying: 'bg-warning animate-pulse',
  disconnected: 'bg-muted-foreground',
};

const statusTitle: Record<string, string> = {
  connected: 'Conectado',
  connecting: 'Conectando...',
  retrying: 'Reintentando...',
  disconnected: 'Sin conexion',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, status } =
    useRealtime();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'bg-muted text-foreground',
        )}
      >
        <BellIcon className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md bg-popover shadow-[var(--shadow-2)] ring-1 ring-foreground/10"
        >
          <div className="flex items-center justify-between border-b border-foreground/8 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Notificaciones
              </span>
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  statusDotClass[status] ?? 'bg-muted-foreground',
                )}
                title={statusTitle[status] ?? status}
              />
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 rounded px-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CheckCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar todo
              </button>
            )}
          </div>

          <div
            className="max-h-80 overflow-y-auto p-1"
            role="list"
            aria-label="Lista de notificaciones"
          >
            {notifications.length === 0 ? (
              <div className="py-8 text-center" role="listitem">
                <CircleDotIcon
                  className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Sin notificaciones
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  Los eventos del sistema apareceran aqui
                </p>
              </div>
            ) : (
              <div className="space-y-0.5" role="list">
                {notifications.map((n) => (
                  <div key={n.id} role="listitem">
                    <NotificationItem notification={n} onRead={markAsRead} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-foreground/8 px-3 py-2">
              <p className="text-center text-xs text-muted-foreground">
                {notifications.length}{' '}
                {notifications.length === 1
                  ? 'notificacion'
                  : 'notificaciones'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
