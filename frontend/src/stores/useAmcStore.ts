import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AmcContract, DgMaintenanceLog, DgSummary } from '@/types';

interface AmcState {
  contracts: AmcContract[];
  expiring: AmcContract[];
  dgLogs: DgMaintenanceLog[];
  dgSummary: DgSummary | null;
  loading: boolean;

  loadContracts: (params?: Record<string, string | undefined>) => Promise<void>;
  loadExpiring: () => Promise<void>;
  loadDgLogs: (params?: Record<string, string | undefined>) => Promise<void>;
  loadDgSummary: () => Promise<void>;
  createContract: (payload: Partial<AmcContract>) => Promise<AmcContract>;
  updateContract: (id: string, payload: Partial<AmcContract>) => Promise<AmcContract>;
  deleteContract: (id: string) => Promise<void>;
  createDgLog: (payload: Partial<DgMaintenanceLog>) => Promise<DgMaintenanceLog>;
  updateDgLog: (id: string, payload: Partial<DgMaintenanceLog>) => Promise<DgMaintenanceLog>;
  deleteDgLog: (id: string) => Promise<void>;
}

export const useAmcStore = create<AmcState>()((set) => ({
  contracts: [],
  expiring: [],
  dgLogs: [],
  dgSummary: null,
  loading: false,

  loadContracts: async (params) => {
    set({ loading: true });
    try {
      const result = await api.amc.list(params);
      set({ contracts: result.items });
    } finally { set({ loading: false }); }
  },

  loadExpiring: async () => {
    const expiring = await api.amc.expiring();
    set({ expiring });
  },

  loadDgLogs: async (params) => {
    set({ loading: true });
    try {
      const result = await api.amc.dgLogs(params);
      set({ dgLogs: result.items });
    } finally { set({ loading: false }); }
  },

  loadDgSummary: async () => {
    const dgSummary = await api.amc.dgSummary();
    set({ dgSummary });
  },

  createContract: async (payload) => {
    const contract = await api.amc.create(payload);
    set((s) => ({ contracts: [contract, ...s.contracts] }));
    return contract;
  },

  updateContract: async (id, payload) => {
    const updated = await api.amc.update(id, payload);
    set((s) => ({ contracts: s.contracts.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },

  deleteContract: async (id) => {
    await api.amc.destroy(id);
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }));
  },

  createDgLog: async (payload) => {
    const log = await api.amc.dgCreate(payload);
    set((s) => ({ dgLogs: [log, ...s.dgLogs] }));
    return log;
  },

  updateDgLog: async (id, payload) => {
    const updated = await api.amc.dgUpdate(id, payload);
    set((s) => ({ dgLogs: s.dgLogs.map((l) => (l.id === id ? updated : l)) }));
    return updated;
  },

  deleteDgLog: async (id) => {
    await api.amc.dgDestroy(id);
    set((s) => ({ dgLogs: s.dgLogs.filter((l) => l.id !== id) }));
  },
}));
