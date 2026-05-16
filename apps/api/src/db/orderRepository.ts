import { randomUUID } from 'crypto';
import db from './database';
import { sendOrderReceipt } from '../services/mailer';

export interface CartItemRecord {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface DbOrder {
  id: string;
  session_id: string;
  items: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

function parseOrder(row: DbOrder) {
  return {
    id: row.id,
    sessionId: row.session_id,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function createOrder(data: {
  sessionId: string;
  items: CartItemRecord[];
  subtotal: number;
  tax: number;
  total: number;
  email?: string;
}) {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO orders (id, session_id, items, subtotal, tax, total)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.sessionId, JSON.stringify(data.items), data.subtotal, data.tax, data.total);

  const order = { id, ...data, status: 'placed', createdAt: new Date().toISOString(), completedAt: null };

  if (data.email) {
    sendOrderReceipt(data.email, order).catch(err =>
      console.error('[mailer] Failed to send receipt:', err),
    );
  }

  return order;
}

export function getOrdersBySession(sessionId: string) {
  const rows = db.prepare(`
    SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(sessionId) as DbOrder[];
  return rows.map(parseOrder);
}

export function getOrderById(orderId: string) {
  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as DbOrder | undefined;
  return row ? parseOrder(row) : null;
}

export function updateOrderStatus(orderId: string, status: string) {
  db.prepare(`
    UPDATE orders
    SET status = ?,
        completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END
    WHERE id = ?
  `).run(status, status, orderId);
}
