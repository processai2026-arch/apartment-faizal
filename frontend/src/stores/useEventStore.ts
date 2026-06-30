import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CommunityEvent, EventDashboard, EventRegistration } from '@/types';

interface EventState {
  adminEvents: CommunityEvent[];
  tenantEvents: CommunityEvent[];
  myRegistrations: EventRegistration[];
  selectedEvent: CommunityEvent | null;
  dashboard: EventDashboard | null;
  loading: boolean;
  adminPagination?: { total: number; page: number; perPage: number; totalPages: number };
  tenantPagination?: { total: number; page: number; perPage: number; totalPages: number };

  loadAdminEvents: (params?: Record<string, string | undefined>) => Promise<void>;
  loadTenantEvents: (params?: Record<string, string | undefined>) => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadEvent: (id: string) => Promise<CommunityEvent>;
  createEvent: (payload: Partial<CommunityEvent>) => Promise<CommunityEvent>;
  updateEvent: (id: string, payload: Partial<CommunityEvent>) => Promise<CommunityEvent>;
  publishEvent: (id: string) => Promise<void>;
  cancelEvent: (id: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (id: string) => Promise<EventRegistration>;
  cancelRegistration: (id: string) => Promise<void>;
  loadMyRegistrations: () => Promise<void>;
}

export const useEventStore = create<EventState>()((set, get) => ({
  adminEvents: [],
  tenantEvents: [],
  myRegistrations: [],
  selectedEvent: null,
  dashboard: null,
  loading: false,

  loadAdminEvents: async (params) => {
    set({ loading: true });
    try {
      const result = await api.events.adminList(params);
      set({ adminEvents: result.items, adminPagination: result.pagination });
    } finally {
      set({ loading: false });
    }
  },

  loadTenantEvents: async (params) => {
    set({ loading: true });
    try {
      const result = await api.events.tenantList(params);
      set({ tenantEvents: result.items, tenantPagination: result.pagination });
    } finally {
      set({ loading: false });
    }
  },

  loadDashboard: async () => {
    const dashboard = await api.events.adminDashboard();
    set({ dashboard });
  },

  loadEvent: async (id) => {
    set({ loading: true });
    try {
      const event = await api.events.adminShow(id);
      set({ selectedEvent: event });
      return event;
    } finally {
      set({ loading: false });
    }
  },

  createEvent: async (payload) => {
    const event = await api.events.adminCreate(payload);
    set((s) => ({ adminEvents: [event, ...s.adminEvents] }));
    return event;
  },

  updateEvent: async (id, payload) => {
    const updated = await api.events.adminUpdate(id, payload);
    set((s) => ({
      adminEvents: s.adminEvents.map((e) => (e.id === id ? updated : e)),
      selectedEvent: s.selectedEvent?.id === id ? updated : s.selectedEvent,
    }));
    return updated;
  },

  publishEvent: async (id) => {
    const updated = await api.events.publish(id);
    set((s) => ({
      adminEvents: s.adminEvents.map((e) => (e.id === id ? updated : e)),
      selectedEvent: s.selectedEvent?.id === id ? updated : s.selectedEvent,
    }));
  },

  cancelEvent: async (id) => {
    const updated = await api.events.cancel(id);
    set((s) => ({
      adminEvents: s.adminEvents.map((e) => (e.id === id ? updated : e)),
      selectedEvent: s.selectedEvent?.id === id ? updated : s.selectedEvent,
    }));
  },

  deleteEvent: async (id) => {
    await api.events.adminDestroy(id);
    set((s) => ({ adminEvents: s.adminEvents.filter((e) => e.id !== id) }));
  },

  registerForEvent: async (id) => {
    const registration = await api.events.register(id);
    // Update the tenant event's isRegistered flag
    set((s) => ({
      tenantEvents: s.tenantEvents.map((e) =>
        e.id === id
          ? { ...e, isRegistered: true, myRegistration: registration, registrationCount: (e.registrationCount ?? 0) + 1 }
          : e
      ),
      selectedEvent:
        s.selectedEvent?.id === id
          ? { ...s.selectedEvent, isRegistered: true, myRegistration: registration, registrationCount: (s.selectedEvent.registrationCount ?? 0) + 1 }
          : s.selectedEvent,
    }));
    return registration;
  },

  cancelRegistration: async (id) => {
    await api.events.cancelRegistration(id);
    set((s) => ({
      tenantEvents: s.tenantEvents.map((e) =>
        e.id === id
          ? { ...e, isRegistered: false, registrationCount: Math.max(0, (e.registrationCount ?? 1) - 1) }
          : e
      ),
      selectedEvent:
        s.selectedEvent?.id === id
          ? { ...s.selectedEvent, isRegistered: false, registrationCount: Math.max(0, (s.selectedEvent.registrationCount ?? 1) - 1) }
          : s.selectedEvent,
    }));
  },

  loadMyRegistrations: async () => {
    const regs = await api.events.myRegistrations();
    set({ myRegistrations: regs });
  },
}));
