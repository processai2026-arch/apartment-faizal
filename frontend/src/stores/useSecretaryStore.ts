import { create } from 'zustand';
import { api } from '@/lib/api';
import type { SecretaryUser, SecretaryPermission, SecretaryDashboardData } from '@/lib/api';

interface SecretaryState {
  secretaries: SecretaryUser[];
  selectedSecretary: SecretaryUser | null;
  permissions: string[];         // current user's allowed modules
  dashboard: SecretaryDashboardData | null;
  loading: boolean;

  loadSecretaries: () => Promise<void>;
  loadSecretary: (id: string) => Promise<SecretaryUser>;
  createSecretary: (payload: Partial<SecretaryUser> & { password?: string; user_id?: number }) => Promise<SecretaryUser>;
  updateSecretary: (id: string, payload: Partial<SecretaryUser>) => Promise<SecretaryUser>;
  setPermissions: (id: string, permissions: SecretaryPermission[]) => Promise<SecretaryUser>;
  removeSecretary: (id: string) => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadMyPermissions: () => Promise<void>;
}

export const useSecretaryStore = create<SecretaryState>()((set, get) => ({
  secretaries: [],
  selectedSecretary: null,
  permissions: [],
  dashboard: null,
  loading: false,

  loadSecretaries: async () => {
    set({ loading: true });
    try {
      const secretaries = await api.secretary.list();
      set({ secretaries });
    } finally {
      set({ loading: false });
    }
  },

  loadSecretary: async (id) => {
    set({ loading: true });
    try {
      const secretary = await api.secretary.show(id);
      set({ selectedSecretary: secretary });
      return secretary;
    } finally {
      set({ loading: false });
    }
  },

  createSecretary: async (payload) => {
    const created = await api.secretary.create(payload);
    set((s) => ({ secretaries: [created, ...s.secretaries] }));
    return created;
  },

  updateSecretary: async (id, payload) => {
    const updated = await api.secretary.update(id, payload);
    set((s) => ({
      secretaries: s.secretaries.map((sec) => (String(sec.id) === id ? updated : sec)),
      selectedSecretary: s.selectedSecretary && String(s.selectedSecretary.id) === id ? updated : s.selectedSecretary,
    }));
    return updated;
  },

  setPermissions: async (id, permissions) => {
    const updated = await api.secretary.setPermissions(id, permissions);
    set((s) => ({
      secretaries: s.secretaries.map((sec) => (String(sec.id) === id ? updated : sec)),
      selectedSecretary: s.selectedSecretary && String(s.selectedSecretary.id) === id ? updated : s.selectedSecretary,
    }));
    return updated;
  },

  removeSecretary: async (id) => {
    await api.secretary.remove(id);
    set((s) => ({
      secretaries: s.secretaries.filter((sec) => String(sec.id) !== id),
      selectedSecretary: s.selectedSecretary && String(s.selectedSecretary.id) === id ? null : s.selectedSecretary,
    }));
  },

  loadDashboard: async () => {
    set({ loading: true });
    try {
      const dashboard = await api.secretary.dashboard();
      set({ dashboard });
    } finally {
      set({ loading: false });
    }
  },

  loadMyPermissions: async () => {
    try {
      const result = await api.secretary.myPermissions();
      set({ permissions: result.modules });
    } catch {
      set({ permissions: [] });
    }
  },
}));
