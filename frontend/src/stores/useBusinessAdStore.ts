import { create } from 'zustand';
import { api } from '@/lib/api';
import type { BusinessAd, BusinessAdDashboard, BusinessCategory } from '@/types';

interface BusinessAdState {
  ads: BusinessAd[];
  categories: BusinessCategory[];
  selectedAd: BusinessAd | null;
  adminAds: BusinessAd[];
  dashboard: BusinessAdDashboard | null;
  loading: boolean;

  loadAds: (params?: Record<string, string | undefined>) => Promise<void>;
  loadAd: (id: string) => Promise<BusinessAd>;
  loadCategories: () => Promise<void>;
  loadAdminCategories: () => Promise<void>;
  recordClick: (id: string) => Promise<void>;

  loadAdminAds: (params?: Record<string, string | undefined>) => Promise<void>;
  createAd: (payload: Partial<BusinessAd>) => Promise<BusinessAd>;
  updateAd: (id: string, payload: Partial<BusinessAd>) => Promise<BusinessAd>;
  deleteAd: (id: string) => Promise<void>;
  setStatus: (id: string, status: string) => Promise<void>;
  loadDashboard: () => Promise<void>;

  createCategory: (payload: Partial<BusinessCategory>) => Promise<BusinessCategory>;
  updateCategory: (id: string, payload: Partial<BusinessCategory>) => Promise<BusinessCategory>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useBusinessAdStore = create<BusinessAdState>()((set) => ({
  ads: [],
  categories: [],
  selectedAd: null,
  adminAds: [],
  dashboard: null,
  loading: false,

  loadAds: async (params) => {
    set({ loading: true });
    try {
      const ads = await api.businessAds.tenantList(params);
      set({ ads });
    } finally { set({ loading: false }); }
  },

  loadAd: async (id) => {
    const ad = await api.businessAds.tenantShow(id);
    set({ selectedAd: ad });
    return ad;
  },

  loadCategories: async () => {
    const categories = await api.businessAds.tenantCategories();
    set({ categories });
  },

  loadAdminCategories: async () => {
    const categories = await api.businessAds.adminCategories();
    set({ categories });
  },

  recordClick: async (id) => {
    await api.businessAds.click(id);
  },

  loadAdminAds: async (params) => {
    set({ loading: true });
    try {
      const result = await api.businessAds.adminList(params);
      set({ adminAds: result.items });
    } finally { set({ loading: false }); }
  },

  createAd: async (payload) => {
    const ad = await api.businessAds.adminCreate(payload);
    set((s) => ({ adminAds: [ad, ...s.adminAds] }));
    return ad;
  },

  updateAd: async (id, payload) => {
    const updated = await api.businessAds.adminUpdate(id, payload);
    set((s) => ({ adminAds: s.adminAds.map((a) => (a.id === id ? updated : a)) }));
    return updated;
  },

  deleteAd: async (id) => {
    await api.businessAds.adminDestroy(id);
    set((s) => ({ adminAds: s.adminAds.filter((a) => a.id !== id) }));
  },

  setStatus: async (id, status) => {
    const updated = await api.businessAds.adminStatus(id, status);
    set((s) => ({ adminAds: s.adminAds.map((a) => (a.id === id ? updated : a)) }));
  },

  loadDashboard: async () => {
    const dashboard = await api.businessAds.dashboard();
    set({ dashboard });
  },

  createCategory: async (payload) => {
    const cat = await api.businessAds.createCategory(payload as { name: string; slug: string; icon?: string });
    set((s) => ({ categories: [...s.categories, cat] }));
    return cat;
  },

  updateCategory: async (id, payload) => {
    const updated = await api.businessAds.updateCategory(id, payload);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },

  deleteCategory: async (id) => {
    await api.businessAds.deleteCategory(id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));
