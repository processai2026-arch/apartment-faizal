import { create } from 'zustand';
import { api } from '@/lib/api';
import type { MedicalReport, MedicalSummary } from '@/types';

interface MedicalState {
  reports: MedicalReport[];
  summary: MedicalSummary | null;
  loading: boolean;

  loadReports: (params?: Record<string, string | undefined>) => Promise<void>;
  loadSummary: () => Promise<void>;
  createReport: (payload: Partial<MedicalReport>) => Promise<MedicalReport>;
  updateReport: (id: string, payload: Partial<MedicalReport>) => Promise<MedicalReport>;
  deleteReport: (id: string) => Promise<void>;
}

export const useMedicalStore = create<MedicalState>()((set) => ({
  reports: [],
  summary: null,
  loading: false,

  loadReports: async (params) => {
    set({ loading: true });
    try {
      const result = await api.medical.list(params);
      set({ reports: result.items });
    } finally { set({ loading: false }); }
  },

  loadSummary: async () => {
    const summary = await api.medical.summary();
    set({ summary });
  },

  createReport: async (payload) => {
    const report = await api.medical.create(payload);
    set((s) => ({ reports: [report, ...s.reports] }));
    return report;
  },

  updateReport: async (id, payload) => {
    const updated = await api.medical.update(id, payload);
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? updated : r)) }));
    return updated;
  },

  deleteReport: async (id) => {
    await api.medical.destroy(id);
    set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }));
  },
}));
