import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Announcement } from '@/types';

interface AnnouncementState {
  announcements: Announcement[];
  unreadCount: number;
  selectedAnnouncement: Announcement | null;
  adminAnnouncements: Announcement[];
  loading: boolean;

  loadAnnouncements: (params?: Record<string, string | undefined>) => Promise<void>;
  loadAnnouncement: (id: string) => Promise<Announcement>;
  markRead: (id: string) => Promise<void>;
  loadUnreadCount: () => Promise<void>;

  loadAdminAnnouncements: (params?: Record<string, string | undefined>) => Promise<void>;
  createAnnouncement: (payload: Partial<Announcement> & { publishNow?: boolean }) => Promise<Announcement>;
  updateAnnouncement: (id: string, payload: Partial<Announcement> & { publishNow?: boolean }) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  publishAnnouncement: (id: string) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementState>()((set) => ({
  announcements: [],
  unreadCount: 0,
  selectedAnnouncement: null,
  adminAnnouncements: [],
  loading: false,

  loadAnnouncements: async (params) => {
    set({ loading: true });
    try {
      const announcements = await api.announcements.tenantList(params);
      set({ announcements });
    } finally { set({ loading: false }); }
  },

  loadAnnouncement: async (id) => {
    const a = await api.announcements.tenantShow(id);
    set({ selectedAnnouncement: a });
    return a;
  },

  markRead: async (id) => {
    await api.announcements.markRead(id);
    set((s) => ({
      announcements: s.announcements.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  loadUnreadCount: async () => {
    const { count } = await api.announcements.unreadCount();
    set({ unreadCount: count });
  },

  loadAdminAnnouncements: async (params) => {
    set({ loading: true });
    try {
      const result = await api.announcements.adminList(params);
      set({ adminAnnouncements: result.items });
    } finally { set({ loading: false }); }
  },

  createAnnouncement: async (payload) => {
    const a = await api.announcements.adminCreate(payload);
    set((s) => ({ adminAnnouncements: [a, ...s.adminAnnouncements] }));
    return a;
  },

  updateAnnouncement: async (id, payload) => {
    const updated = await api.announcements.adminUpdate(id, payload);
    set((s) => ({ adminAnnouncements: s.adminAnnouncements.map((a) => (a.id === id ? updated : a)) }));
    return updated;
  },

  deleteAnnouncement: async (id) => {
    await api.announcements.adminDestroy(id);
    set((s) => ({ adminAnnouncements: s.adminAnnouncements.filter((a) => a.id !== id) }));
  },

  publishAnnouncement: async (id) => {
    const updated = await api.announcements.publish(id);
    set((s) => ({ adminAnnouncements: s.adminAnnouncements.map((a) => (a.id === id ? updated : a)) }));
  },
}));
