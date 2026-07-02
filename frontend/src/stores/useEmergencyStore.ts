import { create } from 'zustand';
import { api } from '@/lib/api';
import type { EmergencyContact } from '@/types';

interface EmergencyState {
  contacts: EmergencyContact[];
  loading: boolean;

  loadContacts: (params?: Record<string, string | undefined>) => Promise<void>;
  loadAdminContacts: (params?: Record<string, string | undefined>) => Promise<void>;
  createContact: (payload: Partial<EmergencyContact>) => Promise<EmergencyContact>;
  updateContact: (id: string, payload: Partial<EmergencyContact>) => Promise<EmergencyContact>;
  deleteContact: (id: string) => Promise<void>;
}

export const useEmergencyStore = create<EmergencyState>()((set) => ({
  contacts: [],
  loading: false,

  // Tenant/security view — hits /tenant/emergency-contacts
  loadContacts: async (params) => {
    set({ loading: true });
    try {
      const contacts = await api.emergencyContacts.list(params);
      set({ contacts });
    } finally { set({ loading: false }); }
  },

  // Admin view — hits /admin/emergency-contacts
  loadAdminContacts: async (params) => {
    set({ loading: true });
    try {
      const result = await api.emergencyContacts.adminList(params);
      set({ contacts: result.items });
    } finally { set({ loading: false }); }
  },

  createContact: async (payload) => {
    const contact = await api.emergencyContacts.adminCreate(payload);
    set((s) => ({ contacts: [...s.contacts, contact] }));
    return contact;
  },

  updateContact: async (id, payload) => {
    const updated = await api.emergencyContacts.adminUpdate(id, payload);
    set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },

  deleteContact: async (id) => {
    await api.emergencyContacts.adminDestroy(id);
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
  },
}));
