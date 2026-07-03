import { create } from 'zustand';
import { api } from '@/lib/api';
import type { OfficeExpense, ExpenseSummary, ExpenseReport } from '@/types';

interface ExpenseState {
  expenses: OfficeExpense[];
  summary: ExpenseSummary | null;
  report: ExpenseReport | null;
  loading: boolean;

  loadExpenses: (params?: Record<string, string | undefined>) => Promise<void>;
  loadSummary: () => Promise<void>;
  createExpense: (payload: Partial<OfficeExpense>) => Promise<OfficeExpense>;
  updateExpense: (id: string, payload: Partial<OfficeExpense>) => Promise<OfficeExpense>;
  deleteExpense: (id: string) => Promise<void>;
  setStatus: (id: string, status: OfficeExpense['status']) => Promise<OfficeExpense>;
  loadReport: (params?: { from?: string; to?: string; payment_method?: string }) => Promise<ExpenseReport>;
}

export const useExpenseStore = create<ExpenseState>()((set) => ({
  expenses: [],
  summary: null,
  report: null,
  loading: false,

  loadExpenses: async (params) => {
    set({ loading: true });
    try {
      const result = await api.officeExpenses.list(params);
      set({ expenses: result.items });
    } finally { set({ loading: false }); }
  },

  loadSummary: async () => {
    const summary = await api.officeExpenses.summary();
    set({ summary });
  },

  createExpense: async (payload) => {
    const expense = await api.officeExpenses.create(payload);
    set((s) => ({ expenses: [expense, ...s.expenses] }));
    return expense;
  },

  updateExpense: async (id, payload) => {
    const updated = await api.officeExpenses.update(id, payload);
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)) }));
    return updated;
  },

  deleteExpense: async (id) => {
    await api.officeExpenses.destroy(id);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  setStatus: async (id, status) => {
    const updated = await api.officeExpenses.update(id, { status });
    set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)) }));
    return updated;
  },

  loadReport: async (params) => {
    const report = await api.officeExpenses.report(params);
    set({ report });
    return report;
  },
}));
