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

export type AnalyticsSummary = {
  totals: {
    todaySales: number;
    weekSales: number;
    duesOutstanding: number;
    paidCountToday: number;
    avgOrderToday: number;
    itemsSoldToday: number;
    taxCollectedToday: number;
    dueCountToday: number;
    conversionToday: number; // paid / (paid + due)
  };
  trendLast7Days: { key: string; total: number }[];
  salesByCategoryToday: { category: string; total: number }[];
  topItemsToday: { name: string; total: number }[];
};

function startOfDayMs(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function loadAnalytics(): Promise<AnalyticsSummary> {
  const db = await getDb();
  const now = Date.now();
  const todayStart = startOfDayMs(now);
  const weekStart = startOfDayMs(now - 6 * 24 * 60 * 60 * 1000);

  // Paid bills for last 7 days
  const paidRows = await db.getAllAsync<{ total: number; created_at: number; subtotal: number; tax_pct: number; discount_pct: number }>(
    'SELECT total, created_at, subtotal, tax_pct, discount_pct FROM bills WHERE status = ? AND created_at >= ? ORDER BY created_at ASC',
    ['paid', weekStart]
  );
  const trendMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const dayKey = new Date(startOfDayMs(now - i * 24 * 60 * 60 * 1000)).toDateString();
    trendMap.set(dayKey, 0);
  }
  let todaySales = 0;
  let paidCountToday = 0;
  let itemsSoldToday = 0;
  let taxCollectedToday = 0;
  for (const r of paidRows) {
    const key = new Date(startOfDayMs(r.created_at)).toDateString();
    trendMap.set(key, (trendMap.get(key) || 0) + r.total);
    if (r.created_at >= todayStart) {
      todaySales += r.total;
      paidCountToday += 1;
      // tax amount from stored fields
      taxCollectedToday += (r.subtotal * (r.tax_pct ?? 0)) / 100;
    }
  }

  // Items sold today (from paid orders today)
  const itemsToday = await db.getAllAsync<{ qty: number }>(
    'SELECT SUM(oi.quantity) as qty FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN bills b ON b.order_id = o.id WHERE o.status = ? AND b.created_at >= ?',
    ['paid', todayStart]
  );
  itemsSoldToday = Number(itemsToday[0]?.qty || 0);

  // Week sales sum
  const weekSales = Array.from(trendMap.values()).reduce((s, v) => s + v, 0);

  // Dues outstanding total (unpaid)
  const duesRow = await db.getAllAsync<{ total: number }>(
    'SELECT COALESCE(SUM(b.total),0) as total FROM bills b LEFT JOIN dues d ON d.bill_id = b.id WHERE b.status = ? AND (d.paid_at IS NULL OR d.paid_at = 0)',
    ['due']
  );
  const duesOutstanding = Number(duesRow[0]?.total || 0);

  // Due count today
  const dueCountRows = await db.getAllAsync<{ c: number }>(
    'SELECT COUNT(1) as c FROM bills WHERE status = ? AND created_at >= ?',
    ['due', todayStart]
  );
  const dueCountToday = Number(dueCountRows[0]?.c || 0);

  const totalOrdersToday = paidCountToday + dueCountToday;
  const conversionToday = totalOrdersToday > 0 ? paidCountToday / totalOrdersToday : 0;
  const avgOrderToday = paidCountToday > 0 ? todaySales / paidCountToday : 0;

  // Sales by category today
  const catRows = await db.getAllAsync<{ category: string | null; total: number }>(
    'SELECT it.category as category, COALESCE(SUM(oi.price * oi.quantity),0) as total FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN bills b ON b.order_id = o.id LEFT JOIN items it ON it.id = oi.item_id WHERE o.status = ? AND b.created_at >= ? GROUP BY it.category',
    ['paid', todayStart]
  );
  const salesByCategoryToday = catRows.map((r) => ({ category: r.category || 'Other', total: r.total }));

  // Top items today
  const topRows = await db.getAllAsync<{ name: string; total: number }>(
    'SELECT oi.name as name, COALESCE(SUM(oi.price * oi.quantity),0) as total FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN bills b ON b.order_id = o.id WHERE o.status = ? AND b.created_at >= ? GROUP BY oi.name ORDER BY total DESC LIMIT 5',
    ['paid', todayStart]
  );
  const topItemsToday = topRows.map((r) => ({ name: r.name, total: r.total }));

  return {
    totals: {
      todaySales,
      weekSales,
      duesOutstanding,
      paidCountToday,
      avgOrderToday,
      itemsSoldToday,
      taxCollectedToday,
      dueCountToday,
      conversionToday,
    },
    trendLast7Days: Array.from(trendMap.entries()).map(([key, total]) => ({ key, total })),
    salesByCategoryToday,
    topItemsToday,
  };
}


