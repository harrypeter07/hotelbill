import { create } from 'zustand';

export type MenuItem = { id: string; name: string; price: number };
export type OrderLine = MenuItem & { quantity: number };

export type TableOrder = {
  tableId: string;
  lines: Record<string, OrderLine>;
  taxPct: number;
  discountPct: number;
};

type OrderState = {
  orders: Record<string, TableOrder>;
  addQuantity: (tableId: string, item: MenuItem, delta: number) => void;
  addItem: (tableId: string, item: MenuItem) => void;
  removeItem: (tableId: string, itemId: string) => void;
  setQuantity: (tableId: string, itemId: string, quantity: number) => void;
  clearTable: (tableId: string) => void;
  setBillAdjustments: (tableId: string, taxPct: number, discountPct: number) => void;
  getLines: (tableId: string) => OrderLine[];
  getTotals: (tableId: string) => { subtotal: number; tax: number; discount: number; total: number };
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: {},
  addQuantity: (tableId, item, delta) =>
    set((state) => {
      const existing: TableOrder =
        state.orders[tableId] || { tableId, lines: {}, taxPct: 5, discountPct: 0 };
      const prev = existing.lines[item.id]?.quantity || 0;
      const next = Math.max(0, Number((prev + delta).toFixed(2)));
      const newLines = { ...existing.lines } as Record<string, OrderLine>;
      if (next === 0) delete newLines[item.id];
      else newLines[item.id] = { ...item, quantity: next };
      return { orders: { ...state.orders, [tableId]: { ...existing, lines: newLines } } };
    }),
  addItem: (tableId, item) =>
    set((state) => {
      const existing: TableOrder =
        state.orders[tableId] || { tableId, lines: {}, taxPct: 5, discountPct: 0 };
      const line = existing.lines[item.id];
      const quantity = (line?.quantity || 0) + 1;
      return {
        orders: {
          ...state.orders,
          [tableId]: {
            ...existing,
            lines: {
              ...existing.lines,
              [item.id]: { ...item, quantity },
            },
          },
        },
      };
    }),
  removeItem: (tableId, itemId) =>
    set((state) => {
      const existing = state.orders[tableId];
      if (!existing) return state;
      const line = existing.lines[itemId];
      if (!line) return state;
      const quantity = Math.max(0, line.quantity - 1);
      const newLines = { ...existing.lines } as Record<string, OrderLine>;
      if (quantity === 0) delete newLines[itemId];
      else newLines[itemId] = { ...line, quantity };
      return { orders: { ...state.orders, [tableId]: { ...existing, lines: newLines } } };
    }),
  setQuantity: (tableId, itemId, quantity) =>
    set((state) => {
      const existing = state.orders[tableId];
      if (!existing) return state;
      const line = existing.lines[itemId];
      const newLines = { ...existing.lines } as Record<string, OrderLine>;
      if (!line) return state;
      if (quantity <= 0) delete newLines[itemId];
      else newLines[itemId] = { ...line, quantity };
      return { orders: { ...state.orders, [tableId]: { ...existing, lines: newLines } } };
    }),
  clearTable: (tableId) =>
    set((state) => {
      const { [tableId]: _omit, ...rest } = state.orders;
      return { orders: rest } as OrderState;
    }),
  setBillAdjustments: (tableId, taxPct, discountPct) =>
    set((state) => {
      const existing = state.orders[tableId] || { tableId, lines: {}, taxPct: 5, discountPct: 0 };
      return {
        orders: { ...state.orders, [tableId]: { ...existing, taxPct, discountPct } },
      };
    }),
  getLines: (tableId) => {
    const o = get().orders[tableId];
    return o ? Object.values(o.lines) : [];
  },
  getTotals: (tableId) => {
    const o = get().orders[tableId];
    const lines = o ? Object.values(o.lines) : [];
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const tax = (subtotal * (o?.taxPct ?? 5)) / 100;
    const discount = (subtotal * (o?.discountPct ?? 0)) / 100;
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, discount, total };
  },
}));


