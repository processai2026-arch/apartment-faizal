import { create } from 'zustand';
import { api } from '@/lib/api';
import type { PayrollRun, Payslip, PayrollSummary } from '@/types';

interface PayrollState {
  runs: PayrollRun[];
  summary: PayrollSummary | null;
  currentRun: PayrollRun | null;
  loading: boolean;

  loadRuns: (params?: Record<string, string | undefined>) => Promise<void>;
  loadSummary: (periodMonth?: string) => Promise<void>;
  generateRun: (periodMonth: string, notes?: string) => Promise<PayrollRun>;
  openRun: (id: string) => Promise<PayrollRun>;
  clearRun: () => void;
  finalizeRun: (id: string) => Promise<PayrollRun>;
  markRunPaid: (id: string) => Promise<PayrollRun>;
  updatePayslip: (id: string, payload: Partial<Payslip>) => Promise<Payslip>;
  payPayslip: (id: string, paymentMethod?: Payslip['paymentMethod']) => Promise<Payslip>;
}

export const usePayrollStore = create<PayrollState>()((set, get) => ({
  runs: [],
  summary: null,
  currentRun: null,
  loading: false,

  loadRuns: async (params) => {
    set({ loading: true });
    try {
      const result = await api.payroll.listRuns(params);
      set({ runs: result.items });
    } finally { set({ loading: false }); }
  },

  loadSummary: async (periodMonth) => {
    const summary = await api.payroll.summary(periodMonth);
    set({ summary });
  },

  generateRun: async (periodMonth, notes) => {
    const run = await api.payroll.generate(periodMonth, notes);
    set((s) => ({ runs: [run, ...s.runs] }));
    return run;
  },

  openRun: async (id) => {
    const run = await api.payroll.showRun(id);
    set({ currentRun: run });
    return run;
  },

  clearRun: () => set({ currentRun: null }),

  finalizeRun: async (id) => {
    const run = await api.payroll.finalizeRun(id);
    set((s) => ({
      runs: s.runs.map((r) => (r.id === id ? { ...r, status: run.status } : r)),
      currentRun: s.currentRun?.id === id ? { ...s.currentRun, status: run.status } : s.currentRun,
    }));
    return run;
  },

  markRunPaid: async (id) => {
    const run = await api.payroll.markRunPaid(id);
    set((s) => ({
      runs: s.runs.map((r) => (r.id === id ? { ...r, status: run.status, paidCount: run.staffCount } : r)),
      currentRun: s.currentRun?.id === id ? run : s.currentRun,
    }));
    return run;
  },

  updatePayslip: async (id, payload) => {
    const slip = await api.payroll.updatePayslip(id, payload);
    const { currentRun } = get();
    if (currentRun?.payslips) {
      set({
        currentRun: {
          ...currentRun,
          payslips: currentRun.payslips.map((p) => (p.id === id ? { ...p, ...slip } : p)),
        },
      });
    }
    return slip;
  },

  payPayslip: async (id, paymentMethod) => {
    const slip = await api.payroll.payPayslip(id, paymentMethod);
    const { currentRun } = get();
    if (currentRun?.payslips) {
      set({
        currentRun: {
          ...currentRun,
          payslips: currentRun.payslips.map((p) => (p.id === id ? { ...p, ...slip } : p)),
        },
      });
    }
    return slip;
  },
}));
