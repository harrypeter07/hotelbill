import { getDb } from '@/lib/db';
import type { OrderLine } from '@/store/order';

export type SavedBill = { id: string };

export async function savePaidBill(params: {
  tableId: string;
  waiterId?: string | null;
  lines: OrderLine[];
  taxPct: number;
  discountPct: number;
}): Promise<SavedBill> {
  const { tableId, waiterId = null, lines, taxPct, discountPct } = params;
  const db = await getDb();
  const orderId = `${tableId}-${Date.now()}`;
  const billId = `b-${Date.now()}`;
  const createdAt = Date.now();
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = (subtotal * taxPct) / 100;
  const discount = (subtotal * discountPct) / 100;
  const total = Math.max(0, subtotal + tax - discount);

  await db.runAsync('BEGIN');
  try {
    await db.runAsync(
      'INSERT INTO orders (id, table_id, waiter_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [orderId, String(tableId), waiterId, 'paid', createdAt]
    );
    for (const l of lines) {
      await db.runAsync(
        'INSERT INTO order_items (id, order_id, item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [`oi-${orderId}-${l.id}`, orderId, l.id, l.name, l.price, l.quantity]
      );
    }
    await db.runAsync(
      'INSERT INTO bills (id, order_id, subtotal, tax_pct, discount_pct, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [billId, orderId, subtotal, taxPct, discountPct, total, 'paid', createdAt]
    );
    await db.runAsync('COMMIT');
  } catch (e) {
    await db.runAsync('ROLLBACK');
    throw e;
  }
  return { id: billId };
}

export async function saveDueBill(params: {
  tableId: string;
  waiterId?: string | null;
  lines: OrderLine[];
  taxPct: number;
  discountPct: number;
  dueName?: string | null;
  duePhone?: string | null;
  photoUri?: string | null;
}): Promise<SavedBill> {
  const { tableId, waiterId = null, lines, taxPct, discountPct, dueName = null, duePhone = null, photoUri = null } = params;
  const db = await getDb();
  const orderId = `${tableId}-${Date.now()}`;
  const billId = `b-${Date.now()}`;
  const createdAt = Date.now();
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = (subtotal * taxPct) / 100;
  const discount = (subtotal * discountPct) / 100;
  const total = Math.max(0, subtotal + tax - discount);

  await db.runAsync('BEGIN');
  try {
    await db.runAsync(
      'INSERT INTO orders (id, table_id, waiter_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [orderId, String(tableId), waiterId, 'due', createdAt]
    );
    for (const l of lines) {
      await db.runAsync(
        'INSERT INTO order_items (id, order_id, item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [`oi-${orderId}-${l.id}`, orderId, l.id, l.name, l.price, l.quantity]
      );
    }
    await db.runAsync(
      'INSERT INTO bills (id, order_id, subtotal, tax_pct, discount_pct, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [billId, orderId, subtotal, taxPct, discountPct, total, 'due', createdAt]
    );
    await db.runAsync(
      'INSERT INTO dues (id, bill_id, name, phone, photo_uri, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [`d-${Date.now()}`, billId, dueName, duePhone, photoUri, createdAt]
    );
    await db.runAsync('COMMIT');
  } catch (e) {
    await db.runAsync('ROLLBACK');
    throw e;
  }
  return { id: billId };
}

export type HistoryRow = { id: string; table: string; date: string; total: number; status: string };

export async function loadHistory(limit = 50): Promise<HistoryRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string; order_id: string; total: number; status: string; created_at: number; table_id: string;
  }>(
    'SELECT b.id, b.order_id, b.total, b.status, b.created_at, o.table_id FROM bills b JOIN orders o ON b.order_id = o.id ORDER BY b.created_at DESC LIMIT ?',[limit]
  );
  return rows.map((r) => ({ id: r.id, table: r.table_id, date: new Date(r.created_at).toLocaleString(), total: r.total, status: r.status }));
}


