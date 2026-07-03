import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Asset, AssetAssignment, AssetAudit, AssetSummary } from '@/types';

interface AssetState {
  assets: Asset[];
  summary: AssetSummary | null;
  openAssignments: AssetAssignment[];
  audits: AssetAudit[];
  loading: boolean;

  loadAssets: (params?: Record<string, string | undefined>) => Promise<void>;
  loadSummary: () => Promise<void>;
  loadOpenAssignments: () => Promise<void>;
  loadAudits: (params?: Record<string, string | undefined>) => Promise<void>;
  createAsset: (payload: Partial<Asset>) => Promise<Asset>;
  updateAsset: (id: string, payload: Partial<Asset>) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  checkout: (id: string, payload: { staffId: string; dueAt?: string; notes?: string }) => Promise<void>;
  checkin: (id: string, payload: { returnCondition?: string; notes?: string }) => Promise<Asset>;
  audit: (id: string, payload: { foundStatus: string; condition: string; remarks?: string }) => Promise<void>;
}

export const useAssetStore = create<AssetState>()((set) => ({
  assets: [],
  summary: null,
  openAssignments: [],
  audits: [],
  loading: false,

  loadAssets: async (params) => {
    set({ loading: true });
    try {
      const result = await api.assets.list(params);
      set({ assets: result.items });
    } finally { set({ loading: false }); }
  },

  loadSummary: async () => {
    const summary = await api.assets.summary();
    set({ summary });
  },

  loadOpenAssignments: async () => {
    const openAssignments = await api.assets.assignments({ open: '1' });
    set({ openAssignments });
  },

  loadAudits: async (params) => {
    const audits = await api.assets.audits(params);
    set({ audits });
  },

  createAsset: async (payload) => {
    const asset = await api.assets.create(payload);
    set((s) => ({ assets: [asset, ...s.assets] }));
    return asset;
  },

  updateAsset: async (id, payload) => {
    const updated = await api.assets.update(id, payload);
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? updated : a)) }));
    return updated;
  },

  deleteAsset: async (id) => {
    await api.assets.destroy(id);
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
  },

  checkout: async (id, payload) => {
    await api.assets.checkout(id, payload);
    const updated = await api.assets.show(id);
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? updated : a)) }));
  },

  checkin: async (id, payload) => {
    const updated = await api.assets.checkin(id, payload);
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? updated : a)) }));
    return updated;
  },

  audit: async (id, payload) => {
    await api.assets.audit(id, payload);
    const updated = await api.assets.show(id);
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? updated : a)) }));
  },
}));
