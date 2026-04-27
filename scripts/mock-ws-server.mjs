/**
 * Mock WebSocket server for development.
 * Requires the `ws` package: npm install -D ws
 *
 * Usage:
 *   node scripts/mock-ws-server.mjs
 *
 * Set in .env:
 *   VITE_WS_URL=ws://localhost:3001
 */

import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = process.env.WS_PORT ?? 3001;

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

const statuses = ['in_progress', 'resolved', 'closed'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const agents = ['Agente Garcia', 'Soporte Nivel 2', 'Tecnico Rodriguez'];
let counter = 1;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEvent() {
  const r = Math.random();
  const id = 100 + counter++;

  if (r < 0.35) {
    return {
      type: 'ticket.created',
      payload: {
        ticket: {
          id,
          title: `Solicitud de soporte #${id}`,
          status: 'open',
          priority: randomItem(priorities),
          createdById: 1,
        },
      },
    };
  }

  if (r < 0.65) {
    return {
      type: 'ticket.assigned',
      payload: {
        ticket: { id, title: `Incidencia en servidor #${id}` },
        assignedTo: { id: 2, name: randomItem(agents) },
      },
    };
  }

  const newStatus = randomItem(statuses);
  return {
    type: 'ticket.status_changed',
    payload: {
      ticket: { id, title: `Ticket de mantenimiento #${id}`, status: newStatus },
      oldStatus: 'open',
      newStatus,
    },
  };
}

function broadcast(event) {
  const msg = JSON.stringify(event);
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(msg);
      count++;
    }
  });
  if (count > 0) {
    console.log(`[ws] Broadcast ${event.type} -> ${count} client(s)`);
  }
}

wss.on('connection', (ws, req) => {
  const token = new URL(req.url ?? '/', 'ws://localhost').searchParams.get('token');
  console.log(`[ws] Client connected${token ? ` (token: ${token.slice(0, 8)}...)` : ''}`);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', payload: {} }));
    } catch {
      // ignore
    }
  });

  ws.on('close', () => console.log('[ws] Client disconnected'));
});

setInterval(() => broadcast(buildEvent()), 10_000);

httpServer.listen(PORT, () => {
  console.log(`[ws] Mock WebSocket server running on ws://localhost:${PORT}`);
  console.log('[ws] Emitting events every 10s. Set VITE_WS_URL=ws://localhost:' + PORT);
});
