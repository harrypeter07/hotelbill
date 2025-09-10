import { create } from 'zustand';
import { getDb } from '@/lib/db';

export type TableInfo = { id: string; name: string };
export type CatalogItem = { id: string; name: string; price: number; half_price?: number | null; category?: string };

type CatalogState = {
  tables: TableInfo[];
  items: CatalogItem[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addOrUpdateTable: (table: Partial<TableInfo> & { name: string }) => void;
  removeTable: (id: string) => void;
  addOrUpdateItem: (item: Partial<CatalogItem> & { name: string; price: number; half_price?: number | null; category?: string }) => void;
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
    try {
      const db = await getDb();
      const tables = await db.getAllAsync<TableInfo>('SELECT id, name FROM tables ORDER BY name');
      const items = await db.getAllAsync<CatalogItem>('SELECT id, name, price, half_price, category FROM items ORDER BY name');
      // Seed defaults if empty
      if (tables.length === 0) {
        const defaults = ['T1','T2','T3'].map((n, i) => ({ id: String(i+1), name: n }));
        await db.runAsync('BEGIN');
        try {
          for (const t of defaults) {
            await db.runAsync('INSERT OR REPLACE INTO tables (id, name, status) VALUES (?, ?, ?)', [t.id, t.name, 'empty']);
          }
          await db.runAsync('COMMIT');
        } catch (e) {
          await db.runAsync('ROLLBACK');
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
        await db.runAsync('BEGIN');
        try {
          for (const i of defaults) {
            await db.runAsync('INSERT OR REPLACE INTO items (id, name, price, half_price, category) VALUES (?, ?, ?, ?, ?)', [i.id, i.name, i.price, null, i.category ?? null]);
          }
          await db.runAsync('COMMIT');
        } catch (e) {
          await db.runAsync('ROLLBACK');
        }
        set({ items: defaults });
      } else {
        set({ items });
      }
    } catch (e) {
      // In case of any unexpected error, still allow app to render
    } finally {
      set({ hydrated: true });
    }
  },
  addOrUpdateTable: (table) =>
    set((s) => {
      const id = ensureId(table.id);
      const existingIdx = s.tables.findIndex((t) => t.id === id);
      const next: TableInfo = { id, name: table.name };

      // Optimistically update state immediately
      const updatedTables = existingIdx >= 0
        ? (() => { const copy = s.tables.slice(); copy[existingIdx] = next; return copy; })()
        : [...s.tables, next];

      // Persist in background
      (async () => {
        try {
          const db = await getDb();
          await db.runAsync('INSERT OR REPLACE INTO tables (id, name, status) VALUES (?, ?, ?)', [id, next.name, 'empty']);
        } catch (error) {
          console.error('addOrUpdateTable persist error:', error);
        }
      })();

      return { tables: updatedTables } as CatalogState;
    }),
  removeTable: (id) =>
    set((s) => {
      const newTables = s.tables.filter((t) => t.id !== id);

      // Persist in background
      (async () => {
        try {
          const db = await getDb();
          await db.runAsync('DELETE FROM tables WHERE id = ?', [id]);
        } catch (error) {
          console.error('removeTable persist error:', error);
        }
      })();

      return { tables: newTables } as CatalogState;
    }),
  addOrUpdateItem: (item) =>
    set((s) => {
      const id = ensureId(item.id);
      const existingIdx = s.items.findIndex((t) => t.id === id);
      const next: CatalogItem = { id, name: item.name, price: Number(item.price), half_price: item.half_price != null ? Number(item.half_price) : null, category: item.category };

      // Optimistic update
      const updatedItems = existingIdx >= 0
        ? (() => { const copy = s.items.slice(); copy[existingIdx] = next; return copy; })()
        : [...s.items, next];

      // Persist in background
      (async () => {
        try {
          const db = await getDb();
          await db.runAsync('INSERT OR REPLACE INTO items (id, name, price, half_price, category) VALUES (?, ?, ?, ?, ?)', [id, next.name, next.price, next.half_price, next.category ?? null]);
        } catch (error) {
          console.error('addOrUpdateItem persist error:', error);
        }
      })();

      return { items: updatedItems } as CatalogState;
    }),
  removeItem: (id) =>
    set((s) => {
      const newItems = s.items.filter((t) => t.id !== id);

      // Persist in background
      (async () => {
        try {
          const db = await getDb();
          await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
        } catch (error) {
          console.error('removeItem persist error:', error);
        }
      })();

      return { items: newItems } as CatalogState;
    }),
}));


