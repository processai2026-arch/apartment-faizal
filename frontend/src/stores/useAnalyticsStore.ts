import { create } from 'zustand';
import { api } from '@/lib/api';
import type { AnalyticsSummary } from '@/types';

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  loading: boolean;
  lastFetched: number | null;

  loadSummary: () => Promise<void>;
  loadSection: (section: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()((set) => ({
  summary: null,
  loading: false,
  lastFetched: null,

  loadSummary: async () => {
    set({ loading: true });
    try {
      const summary = await api.analytics.summary();
      set({ summary, lastFetched: Date.now() });
    } finally {
      set({ loading: false });
    }
  },

  loadSection: async (section: string) => {
    set({ loading: true });
    try {
      switch (section) {
        case 'occupancy': {
          const data = await api.analytics.occupancy();
          set((s) => ({ summary: s.summary ? { ...s.summary, occupancy: data } : s.summary }));
          break;
        }
        case 'complaints': {
          const data = await api.analytics.complaints();
          set((s) => ({ summary: s.summary ? { ...s.summary, complaints: data } : s.summary }));
          break;
        }
        case 'maintenance': {
          const data = await api.analytics.maintenance();
          set((s) => ({ summary: s.summary ? { ...s.summary, maintenance: data } : s.summary }));
          break;
        }
        case 'vendors': {
          const data = await api.analytics.vendors();
          set((s) => ({ summary: s.summary ? { ...s.summary, vendors: data } : s.summary }));
          break;
        }
        case 'rentals': {
          const data = await api.analytics.rentals();
          set((s) => ({ summary: s.summary ? { ...s.summary, rentals: data } : s.summary }));
          break;
        }
        case 'visitors': {
          const data = await api.analytics.visitors();
          set((s) => ({ summary: s.summary ? { ...s.summary, visitors: data } : s.summary }));
          break;
        }
        case 'revenue': {
          const data = await api.analytics.revenue();
          set((s) => ({ summary: s.summary ? { ...s.summary, revenue: data } : s.summary }));
          break;
        }
        case 'workers': {
          const data = await api.analytics.workers();
          set((s) => ({ summary: s.summary ? { ...s.summary, workers: data } : s.summary }));
          break;
        }
        default:
          break;
      }
    } finally {
      set({ loading: false });
    }
  },
}));
