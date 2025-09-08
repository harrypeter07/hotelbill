import { create } from 'zustand';
import { getDb } from '@/lib/db';

export type TableInfo = { id: string; name: string };
export type CatalogItem = { id: string; name: string; price: number; category?: string };

type CatalogState = {
  tables: TableInfo[];
  items: CatalogItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addOrUpdateTable: (table: Partial<TableInfo> & { name: string }) => void;
  removeTable: (id: string) => void;
  addOrUpdateItem: (item: Partial<CatalogItem> & { name: string; price: number; category?: string }) => void;
  removeItem: (id: string) => void;
};

function ensureId(id?: string): string {
  return id ?? String(Date.now());
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  tables: [],
  items: [],
  hydrated: false,
  hydrate: async () => {
    const db = await getDb();
    const tables = await db.getAllAsync<TableInfo>('SELECT id, name FROM tables ORDER BY name');
    const items = await db.getAllAsync<CatalogItem>('SELECT id, name, price, category FROM items ORDER BY name');
    // Seed defaults if empty
    if (tables.length === 0) {
      const defaults = ['T1','T2','T3'].map((n, i) => ({ id: String(i+1), name: n }));
      const tx = await db.execAsync('BEGIN');
      try {
        for (const t of defaults) {
          await db.runAsync('INSERT OR REPLACE INTO tables (id, name, status) VALUES (?, ?, ?)', [t.id, t.name, 'empty']);
        }
        await db.execAsync('COMMIT');
      } catch (e) {
        await db.execAsync('ROLLBACK');
      }
      set({ tables: defaults });
    } else {
      set({ tables });
    }
    if (items.length === 0) {
      const defaults: CatalogItem[] = [
        { id: 'chapati', name: 'Chapati', price: 15, category: 'Breads' },
        { id: 'dal', name: 'Dal', price: 60, category: 'Main' },
        { id: 'paneer', name: 'Paneer', price: 180, category: 'Main' },
      ];
      const tx2 = await db.execAsync('BEGIN');
      try {
        for (const i of defaults) {
          await db.runAsync('INSERT OR REPLACE INTO items (id, name, price, category) VALUES (?, ?, ?, ?)', [i.id, i.name, i.price, i.category ?? null]);
        }
        await db.execAsync('COMMIT');
      } catch (e) {
        await db.execAsync('ROLLBACK');
      }
      set({ items: defaults });
    } else {
      set({ items });
    }
    set({ hydrated: true });
  },
  addOrUpdateTable: (table) =>
    set(async (s) => {
      const id = ensureId(table.id);
      const existingIdx = s.tables.findIndex((t) => t.id === id);
      const next: TableInfo = { id, name: table.name };
      const db = await getDb();
      await db.runAsync('INSERT OR REPLACE INTO tables (id, name, status) VALUES (?, ?, ?)', [id, next.name, 'empty']);
      if (existingIdx >= 0) {
        const copy = s.tables.slice();
        copy[existingIdx] = next;
        return { tables: copy } as CatalogState;
      }
      return { tables: [...s.tables, next] } as CatalogState;
    }),
  removeTable: (id) =>
    set(async (s) => {
      const db = await getDb();
      await db.runAsync('DELETE FROM tables WHERE id = ?', [id]);
      return { tables: s.tables.filter((t) => t.id !== id) } as CatalogState;
    }),
  addOrUpdateItem: (item) =>
    set(async (s) => {
      const id = ensureId(item.id);
      const existingIdx = s.items.findIndex((t) => t.id === id);
      const next: CatalogItem = { id, name: item.name, price: Number(item.price), category: item.category };
      const db = await getDb();
      await db.runAsync('INSERT OR REPLACE INTO items (id, name, price, category) VALUES (?, ?, ?, ?)', [id, next.name, next.price, next.category ?? null]);
      if (existingIdx >= 0) {
        const copy = s.items.slice();
        copy[existingIdx] = next;
        return { items: copy } as CatalogState;
      }
      return { items: [...s.items, next] } as CatalogState;
    }),
  removeItem: (id) =>
    set(async (s) => {
      const db = await getDb();
      await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
      return { items: s.items.filter((t) => t.id !== id) } as CatalogState;
    }),
}));


