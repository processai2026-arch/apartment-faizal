import { create } from 'zustand';
import { api } from '@/lib/api';
import type { VisitorPass, VisitorPassDashboard } from '@/types';

interface VisitorPassState {
  passes: VisitorPass[];
  selectedPass: VisitorPass | null;
  dashboard: VisitorPassDashboard | null;
  loading: boolean;
  pagination: { total: number; page: number; perPage: number; totalPages: number } | undefined;

  loadPasses: (params?: Record<string, string | undefined>) => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadPass: (id: string) => Promise<VisitorPass>;
  createPass: (payload: {
    passType: string;
    visitorName: string;
    visitorPhone?: string;
    hostName?: string;
    hostOfficeId?: number;
    purpose?: string;
    validFrom: string;
    validUntil: string;
    maxUses: number;
    notes?: string;
  }) => Promise<VisitorPass>;
  updatePass: (id: string, payload: Partial<{
    passType: string;
    visitorName: string;
    visitorPhone: string;
    hostName: string;
    purpose: string;
    validFrom: string;
    validUntil: string;
    maxUses: number;
    notes: string;
    sharedVia: string;
  }>) => Promise<VisitorPass>;
  cancelPass: (id: string) => Promise<VisitorPass>;
  scanPass: (id: string, action: 'entry' | 'exit') => Promise<VisitorPass>;
}

export const useVisitorPassStore = create<VisitorPassState>()((set, get) => ({
  passes: [],
  selectedPass: null,
  dashboard: null,
  loading: false,
  pagination: undefined,

  loadPasses: async (params) => {
    set({ loading: true });
    try {
      const result = await api.visitorPasses.list(params);
      set({ passes: result.items, pagination: result.pagination });
    } finally {
      set({ loading: false });
    }
  },

  loadDashboard: async () => {
    set({ loading: true });
    try {
      const dashboard = await api.visitorPasses.dashboard();
      set({ dashboard });
    } finally {
      set({ loading: false });
    }
  },

  loadPass: async (id) => {
    set({ loading: true });
    try {
      const pass = await api.visitorPasses.show(id);
      set({ selectedPass: pass });
      return pass;
    } finally {
      set({ loading: false });
    }
  },

  createPass: async (payload) => {
    const pass = await api.visitorPasses.create(payload);
    set((s) => ({ passes: [pass, ...s.passes] }));
    return pass;
  },

  updatePass: async (id, payload) => {
    const updated = await api.visitorPasses.update(id, payload);
    set((s) => ({
      passes: s.passes.map((p) => (p.id === id ? updated : p)),
      selectedPass: s.selectedPass?.id === id ? updated : s.selectedPass,
    }));
    return updated;
  },

  cancelPass: async (id) => {
    const updated = await api.visitorPasses.cancel(id);
    set((s) => ({
      passes: s.passes.map((p) => (p.id === id ? updated : p)),
      selectedPass: s.selectedPass?.id === id ? updated : s.selectedPass,
    }));
    return updated;
  },

  scanPass: async (id, action) => {
    const updated = await api.visitorPasses.scan(id, action);
    set((s) => ({
      passes: s.passes.map((p) => (p.id === id ? updated : p)),
      selectedPass: s.selectedPass?.id === id ? updated : s.selectedPass,
    }));
    return updated;
  },
}));
