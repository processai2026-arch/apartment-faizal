import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type {
  MarketplaceVendor,
  VendorBooking,
  VendorCategory,
  VendorReview,
  VendorMarketplaceDashboard,
} from '@/types';

interface VendorMarketplaceState {
  // Shared
  vendors: MarketplaceVendor[];
  categories: VendorCategory[];
  selectedVendor: MarketplaceVendor | null;
  loading: boolean;

  // Tenant
  myBookings: VendorBooking[];
  favorites: string[]; // persisted vendor ids

  // Admin
  adminVendors: MarketplaceVendor[];
  reviews: VendorReview[];
  bookings: VendorBooking[];
  dashboard: VendorMarketplaceDashboard | null;

  // ---- Tenant actions ----
  loadMarketplace: (params?: { search?: string; categoryId?: string; serviceArea?: string; featured?: string; minRating?: string }) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadVendorDetail: (id: string) => Promise<MarketplaceVendor>;
  loadMyBookings: () => Promise<void>;
  bookVendor: (payload: { vendorId: string; serviceId?: string; title: string; description?: string; scheduledFor?: string }) => Promise<VendorBooking>;
  cancelMyBooking: (id: string) => Promise<void>;
  submitReview: (payload: { vendorId: string; bookingId?: string; rating: number; title?: string; comment?: string; attachmentId?: string }) => Promise<VendorReview>;
  toggleFavorite: (vendorId: string) => void;
  isFavorite: (vendorId: string) => boolean;

  // ---- Admin actions ----
  loadAdminVendors: (params?: { search?: string; categoryId?: string; featured?: string; verified?: string; minRating?: string }) => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadReviews: (params?: { status?: string; vendorId?: string }) => Promise<void>;
  loadBookings: (params?: { vendorId?: string }) => Promise<void>;
  verifyVendor: (id: string, verified: boolean) => Promise<void>;
  featureVendor: (id: string, featured: boolean) => Promise<void>;
  setVendorRating: (id: string, ratingAvg: number) => Promise<void>;
  moderateReview: (id: string, status: VendorReview['status']) => Promise<void>;
  setBookingStatus: (id: string, status: VendorBooking['status']) => Promise<void>;
}

export const useVendorMarketplaceStore = create<VendorMarketplaceState>()(
  persist(
    (set, get) => ({
      vendors: [],
      categories: [],
      selectedVendor: null,
      loading: false,
      myBookings: [],
      favorites: [],
      adminVendors: [],
      reviews: [],
      bookings: [],
      dashboard: null,

      // ---- Tenant ----
      loadMarketplace: async (params) => {
        set({ loading: true });
        try {
          const vendors = await api.vendorMarketplace.tenantList(params);
          set({ vendors });
        } finally {
          set({ loading: false });
        }
      },

      loadCategories: async () => {
        const categories = await api.vendorMarketplace.tenantCategories();
        set({ categories });
      },

      loadVendorDetail: async (id) => {
        set({ loading: true });
        try {
          const vendor = await api.vendorMarketplace.tenantShow(id);
          set({ selectedVendor: vendor });
          return vendor;
        } finally {
          set({ loading: false });
        }
      },

      loadMyBookings: async () => {
        const myBookings = await api.vendorMarketplace.tenantBookings();
        set({ myBookings });
      },

      bookVendor: async (payload) => {
        const booking = await api.vendorMarketplace.book(payload);
        set((s) => ({ myBookings: [booking, ...s.myBookings] }));
        return booking;
      },

      cancelMyBooking: async (id) => {
        const updated = await api.vendorMarketplace.cancelBooking(id);
        set((s) => ({ myBookings: s.myBookings.map((b) => (b.id === id ? updated : b)) }));
      },

      submitReview: async (payload) => {
        return api.vendorMarketplace.review(payload);
      },

      toggleFavorite: (vendorId) => {
        set((s) => ({
          favorites: s.favorites.includes(vendorId)
            ? s.favorites.filter((id) => id !== vendorId)
            : [...s.favorites, vendorId],
        }));
      },

      isFavorite: (vendorId) => get().favorites.includes(vendorId),

      // ---- Admin ----
      loadAdminVendors: async (params) => {
        set({ loading: true });
        try {
          const adminVendors = await api.vendorMarketplace.adminList(params);
          set({ adminVendors });
        } finally {
          set({ loading: false });
        }
      },

      loadDashboard: async () => {
        const dashboard = await api.vendorMarketplace.dashboard();
        set({ dashboard });
      },

      loadReviews: async (params) => {
        const reviews = await api.vendorMarketplace.reviews(params);
        set({ reviews });
      },

      loadBookings: async (params) => {
        const bookings = await api.vendorMarketplace.bookings(params);
        set({ bookings });
      },

      verifyVendor: async (id, verified) => {
        const updated = await api.vendorMarketplace.verify(id, verified);
        set((s) => ({ adminVendors: s.adminVendors.map((v) => (v.id === id ? updated : v)) }));
      },

      featureVendor: async (id, featured) => {
        const updated = await api.vendorMarketplace.feature(id, featured);
        set((s) => ({ adminVendors: s.adminVendors.map((v) => (v.id === id ? updated : v)) }));
      },

      setVendorRating: async (id, ratingAvg) => {
        const updated = await api.vendorMarketplace.setRating(id, ratingAvg);
        set((s) => ({ adminVendors: s.adminVendors.map((v) => (v.id === id ? updated : v)) }));
      },

      moderateReview: async (id, status) => {
        const updated = await api.vendorMarketplace.moderateReview(id, status);
        set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? updated : r)) }));
      },

      setBookingStatus: async (id, status) => {
        const updated = await api.vendorMarketplace.bookingStatus(id, status);
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? updated : b)) }));
      },
    }),
    {
      name: 'officegate.vendorFavorites',
      // Only persist favorites; all other data is fetched fresh.
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);
