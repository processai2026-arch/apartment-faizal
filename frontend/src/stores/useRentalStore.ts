import { create } from 'zustand';
import { api } from '@/lib/api';
import type { RentalDashboard, RentalListing } from '@/types';

interface RentalState {
  listings: RentalListing[];
  myListings: RentalListing[];
  favorites: RentalListing[];
  selectedListing: RentalListing | null;
  adminListings: RentalListing[];
  dashboard: RentalDashboard | null;
  loading: boolean;

  loadListings: (params?: Record<string, string | undefined>) => Promise<void>;
  loadListing: (id: string) => Promise<RentalListing>;
  loadMyListings: (params?: Record<string, string | undefined>) => Promise<void>;
  loadFavorites: () => Promise<void>;
  createListing: (payload: Partial<RentalListing>) => Promise<RentalListing>;
  updateListing: (id: string, payload: Partial<RentalListing>) => Promise<RentalListing>;
  deleteListing: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;

  loadAdminListings: (params?: Record<string, string | undefined>) => Promise<{ pagination?: { total: number; page: number; perPage: number; totalPages: number } }>;
  approveListing: (id: string, status: string, comment?: string) => Promise<void>;
  featureListing: (id: string, featured: boolean) => Promise<void>;
  adminDelete: (id: string) => Promise<void>;
  loadDashboard: () => Promise<void>;
}

export const useRentalStore = create<RentalState>()((set, get) => ({
  listings: [],
  myListings: [],
  favorites: [],
  selectedListing: null,
  adminListings: [],
  dashboard: null,
  loading: false,

  loadListings: async (params) => {
    set({ loading: true });
    try {
      const listings = await api.rental.tenantList(params);
      set({ listings });
    } finally {
      set({ loading: false });
    }
  },

  loadListing: async (id) => {
    set({ loading: true });
    try {
      const listing = await api.rental.tenantShow(id);
      set({ selectedListing: listing });
      return listing;
    } finally {
      set({ loading: false });
    }
  },

  loadMyListings: async (params) => {
    set({ loading: true });
    try {
      const myListings = await api.rental.myListings(params);
      set({ myListings });
    } finally {
      set({ loading: false });
    }
  },

  loadFavorites: async () => {
    const favorites = await api.rental.myFavorites();
    set({ favorites });
  },

  createListing: async (payload) => {
    const listing = await api.rental.create(payload);
    set((s) => ({ myListings: [listing, ...s.myListings] }));
    return listing;
  },

  updateListing: async (id, payload) => {
    const updated = await api.rental.update(id, payload);
    set((s) => ({
      myListings: s.myListings.map((l) => (l.id === id ? updated : l)),
    }));
    return updated;
  },

  deleteListing: async (id) => {
    await api.rental.destroy(id);
    set((s) => ({ myListings: s.myListings.filter((l) => l.id !== id) }));
  },

  toggleFavorite: async (id) => {
    const result = await api.rental.toggleFavorite(id);
    set((s) => ({
      listings: s.listings.map((l) => l.id === id ? { ...l, isFavorite: result.favorited, favoriteCount: l.favoriteCount + (result.favorited ? 1 : -1) } : l),
      selectedListing: s.selectedListing?.id === id ? { ...s.selectedListing, isFavorite: result.favorited } : s.selectedListing,
    }));
    return result.favorited;
  },

  loadAdminListings: async (params) => {
    set({ loading: true });
    try {
      const result = await api.rental.adminList(params);
      set({ adminListings: result.items });
      return { pagination: result.pagination };
    } finally {
      set({ loading: false });
    }
  },

  approveListing: async (id, status, comment) => {
    const updated = await api.rental.approve(id, status, comment);
    set((s) => ({ adminListings: s.adminListings.map((l) => (l.id === id ? updated : l)) }));
  },

  featureListing: async (id, featured) => {
    const updated = await api.rental.feature(id, featured);
    set((s) => ({ adminListings: s.adminListings.map((l) => (l.id === id ? updated : l)) }));
  },

  adminDelete: async (id) => {
    await api.rental.adminDestroy(id);
    set((s) => ({ adminListings: s.adminListings.filter((l) => l.id !== id) }));
  },

  loadDashboard: async () => {
    const dashboard = await api.rental.dashboard();
    set({ dashboard });
  },
}));
