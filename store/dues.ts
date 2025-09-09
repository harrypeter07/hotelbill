import { create } from 'zustand';
import { getDb } from '@/lib/db';

export type Due = { id: string; name?: string; phone?: string; amount: number; table?: string; date: string; photoUri?: string; paid?: boolean; billId?: string };

type DuesState = {
  dues: Due[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  addDue: (due: Omit<Due, 'id' | 'date' | 'paid' | 'billId'>) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
};

export const useDuesStore = create<DuesState>((set, get) => ({
  dues: [],
  hydrated: false,
  hydrate: async () => {
    await get().refresh();
    set({ hydrated: true });
  },
  refresh: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string; bill_id: string; name: string | null; phone: string | null; photo_uri: string | null; created_at: number; paid_at: number | null; total: number; table_id: string;
    }>(
      'SELECT d.id, d.bill_id, d.name, d.phone, d.photo_uri, d.created_at, d.paid_at, b.total, o.table_id FROM dues d JOIN bills b ON d.bill_id = b.id JOIN orders o ON b.order_id = o.id ORDER BY d.created_at DESC'
    );
    const dues: Due[] = rows.map((r) => ({
      id: r.id,
      billId: r.bill_id,
      name: r.name || undefined,
      phone: r.phone || undefined,
      photoUri: r.photo_uri || undefined,
      amount: Number(r.total || 0),
      table: r.table_id,
      date: new Date(r.created_at).toISOString(),
      paid: !!r.paid_at,
    }));
    set({ dues });
  },
  addDue: async (d) => {
    const db = await getDb();
    const id = `d-${Date.now()}`;
    const createdAt = Date.now();
    // This function only inserts into dues table; assumes a bill already exists and d.amount reflects bill total. For consistency, real dues should be created via saveDueBill.
    await db.runAsync('INSERT INTO dues (id, bill_id, name, phone, photo_uri, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, d.billId ?? null, d.name ?? null, d.phone ?? null, d.photoUri ?? null, createdAt]);
    await get().refresh();
  },
  markPaid: async (id) => {
    const db = await getDb();
    const now = Date.now();
    // Get bill_id for this due
    const dueRow = await db.getFirstAsync<{ bill_id: string }>('SELECT bill_id FROM dues WHERE id = ?', [id]);
    const billId = dueRow?.bill_id;
    await db.runAsync('BEGIN');
    try {
      await db.runAsync('UPDATE dues SET paid_at = ? WHERE id = ?', [now, id]);
      if (billId) {
        await db.runAsync('UPDATE bills SET status = ? WHERE id = ?', ['paid', billId]);
      }
      await db.runAsync('COMMIT');
    } catch (e) {
      await db.runAsync('ROLLBACK');
      throw e;
    }
    // Update local state
    set((s) => ({ dues: s.dues.map((x) => (x.id === id ? { ...x, paid: true } : x)) }));
  },
}));


