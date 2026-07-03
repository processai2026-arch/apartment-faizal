import { create } from 'zustand';
import { api } from '@/lib/api';
import type { NameTransfer, NameTransferSummary } from '@/types';

interface NameTransferState {
  transfers: NameTransfer[];
  summary: NameTransferSummary | null;
  loading: boolean;

  loadTransfers: (params?: Record<string, string | undefined>) => Promise<void>;
  loadSummary: () => Promise<void>;
  createTransfer: (payload: Partial<NameTransfer>) => Promise<NameTransfer>;
  approveTransfer: (id: string) => Promise<NameTransfer>;
  rejectTransfer: (id: string, notes?: string) => Promise<NameTransfer>;
  completeTransfer: (id: string) => Promise<NameTransfer>;
  deleteTransfer: (id: string) => Promise<void>;
}

function replace(list: NameTransfer[], updated: NameTransfer): NameTransfer[] {
  return list.map((t) => (t.id === updated.id ? updated : t));
}

export const useNameTransferStore = create<NameTransferState>()((set) => ({
  transfers: [],
  summary: null,
  loading: false,

  loadTransfers: async (params) => {
    set({ loading: true });
    try {
      const result = await api.nameTransfers.list(params);
      set({ transfers: result.items });
    } finally { set({ loading: false }); }
  },

  loadSummary: async () => {
    const summary = await api.nameTransfers.summary();
    set({ summary });
  },

  createTransfer: async (payload) => {
    const transfer = await api.nameTransfers.create(payload);
    set((s) => ({ transfers: [transfer, ...s.transfers] }));
    return transfer;
  },

  approveTransfer: async (id) => {
    const updated = await api.nameTransfers.approve(id);
    set((s) => ({ transfers: replace(s.transfers, updated) }));
    return updated;
  },

  rejectTransfer: async (id, notes) => {
    const updated = await api.nameTransfers.reject(id, notes);
    set((s) => ({ transfers: replace(s.transfers, updated) }));
    return updated;
  },

  completeTransfer: async (id) => {
    const updated = await api.nameTransfers.complete(id);
    set((s) => ({ transfers: replace(s.transfers, updated) }));
    return updated;
  },

  deleteTransfer: async (id) => {
    await api.nameTransfers.destroy(id);
    set((s) => ({ transfers: s.transfers.filter((t) => t.id !== id) }));
  },
}));
