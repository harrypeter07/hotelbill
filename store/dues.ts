import { create } from 'zustand';

export type Due = { id: string; name?: string; phone?: string; amount: number; table?: string; date: string; photoUri?: string; paid?: boolean };

type DuesState = {
  dues: Due[];
  addDue: (due: Omit<Due, 'id' | 'date' | 'paid'>) => void;
  markPaid: (id: string) => void;
};

export const useDuesStore = create<DuesState>((set) => ({
  dues: [],
  addDue: (d) =>
    set((s) => ({ dues: [{ id: String(Date.now()), date: new Date().toLocaleString(), paid: false, ...d }, ...s.dues] })),
  markPaid: (id) => set((s) => ({ dues: s.dues.map((x) => (x.id === id ? { ...x, paid: true } : x)) })),
}));


