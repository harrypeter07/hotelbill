import { create } from 'zustand';

export type TableInfo = { id: string; name: string };
export type CatalogItem = { id: string; name: string; price: number };

type CatalogState = {
  tables: TableInfo[];
  items: CatalogItem[];
  addOrUpdateTable: (table: Partial<TableInfo> & { name: string }) => void;
  removeTable: (id: string) => void;
  addOrUpdateItem: (item: Partial<CatalogItem> & { name: string; price: number }) => void;
  removeItem: (id: string) => void;
};

function ensureId(id?: string): string {
  return id ?? String(Date.now());
}

export const useCatalogStore = create<CatalogState>((set) => ({
  tables: [
    { id: '1', name: 'T1' },
    { id: '2', name: 'T2' },
    { id: '3', name: 'T3' },
  ],
  items: [
    { id: 'chapati', name: 'Chapati', price: 15 },
    { id: 'dal', name: 'Dal', price: 60 },
    { id: 'paneer', name: 'Paneer', price: 180 },
  ],
  addOrUpdateTable: (table) =>
    set((s) => {
      const id = ensureId(table.id);
      const existingIdx = s.tables.findIndex((t) => t.id === id);
      const next: TableInfo = { id, name: table.name };
      if (existingIdx >= 0) {
        const copy = s.tables.slice();
        copy[existingIdx] = next;
        return { tables: copy } as CatalogState;
      }
      return { tables: [...s.tables, next] } as CatalogState;
    }),
  removeTable: (id) =>
    set((s) => ({ tables: s.tables.filter((t) => t.id !== id) })),
  addOrUpdateItem: (item) =>
    set((s) => {
      const id = ensureId(item.id);
      const existingIdx = s.items.findIndex((t) => t.id === id);
      const next: CatalogItem = { id, name: item.name, price: Number(item.price) };
      if (existingIdx >= 0) {
        const copy = s.items.slice();
        copy[existingIdx] = next;
        return { items: copy } as CatalogState;
      }
      return { items: [...s.items, next] } as CatalogState;
    }),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));


