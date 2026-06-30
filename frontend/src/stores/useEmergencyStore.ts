import { create } from 'zustand';
import { api } from '@/lib/api';
import type { EmergencyContact } from '@/types';

interface EmergencyState {
  contacts: EmergencyContact[];
  loading: boolean;

  loadContacts: (params?: Record<string, string | undefined>) => Promise<void>;
  createContact: (payload: Partial<EmergencyContact>) => Promise<EmergencyContact>;
  updateContact: (id: string, payload: Partial<EmergencyContact>) => Promise<EmergencyContact>;
  deleteContact: (id: string) => Promise<void>;
}

export const useEmergencyStore = create<EmergencyState>()((set) => ({
  contacts: [],
  loading: false,

  loadContacts: async (params) => {
    set({ loading: true });
    try {
      const contacts = await api.emergencyContacts.list(params);
      set({ contacts });
    } finally { set({ loading: false }); }
  },

  createContact: async (payload) => {
    const contact = await api.emergencyContacts.create(payload);
    set((s) => ({ contacts: [...s.contacts, contact] }));
    return contact;
  },

  updateContact: async (id, payload) => {
    const updated = await api.emergencyContacts.update(id, payload);
    set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? updated : c)) }));
    return updated;
  },

  deleteContact: async (id) => {
    await api.emergencyContacts.delete(id);
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
  },
}));
