import { create } from 'zustand';
import { api } from '@/lib/api';
import type { HomeAutomationHub, HomeAutomationDevice, HomeAutomationSummary } from '@/types';

interface HomeAutomationState {
  hubs: HomeAutomationHub[];
  devices: HomeAutomationDevice[];
  summary: HomeAutomationSummary | null;
  loading: boolean;
  devicesLoading: boolean;

  // Admin
  loadHubs: () => Promise<void>;
  loadSummary: () => Promise<void>;
  createHub: (payload: Partial<HomeAutomationHub> & { accessToken?: string }) => Promise<HomeAutomationHub>;
  updateHub: (id: string, payload: Partial<HomeAutomationHub> & { accessToken?: string }) => Promise<HomeAutomationHub>;
  removeHub: (id: string) => Promise<void>;
  checkHealth: (id: string) => Promise<boolean>;
  syncDevices: (id: string) => Promise<{ imported: number; total: number }>;
  loadDevices: (hubId: string) => Promise<void>;
  updateDevice: (id: string, payload: { friendlyName?: string; isControllable?: boolean; visibleToOwner?: boolean }) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  command: (hubId: string, entityId: string, service: string) => Promise<void>;

  // Tenant
  loadMyHubs: () => Promise<void>;
  loadMyDevices: (hubId: string) => Promise<void>;
  myCommand: (hubId: string, entityId: string, service: string) => Promise<void>;
}

export const useHomeAutomationStore = create<HomeAutomationState>()((set, get) => ({
  hubs: [],
  devices: [],
  summary: null,
  loading: false,
  devicesLoading: false,

  loadHubs: async () => {
    set({ loading: true });
    try {
      const result = await api.homeAutomation.hubs({ perPage: '100' });
      set({ hubs: result.items });
    } finally {
      set({ loading: false });
    }
  },

  loadSummary: async () => {
    const summary = await api.homeAutomation.summary();
    set({ summary });
  },

  createHub: async (payload) => {
    const hub = await api.homeAutomation.createHub(payload);
    set((s) => ({ hubs: [hub, ...s.hubs] }));
    return hub;
  },

  updateHub: async (id, payload) => {
    const updated = await api.homeAutomation.updateHub(id, payload);
    set((s) => ({ hubs: s.hubs.map((h) => (h.id === id ? updated : h)) }));
    return updated;
  },

  removeHub: async (id) => {
    await api.homeAutomation.removeHub(id);
    set((s) => ({ hubs: s.hubs.filter((h) => h.id !== id) }));
  },

  checkHealth: async (id) => {
    const res = await api.homeAutomation.checkHealth(id);
    await get().loadHubs();
    return res.ok;
  },

  syncDevices: async (id) => {
    const res = await api.homeAutomation.syncDevices(id);
    await get().loadDevices(id);
    return { imported: res.imported, total: res.total };
  },

  loadDevices: async (hubId) => {
    set({ devicesLoading: true });
    try {
      const devices = await api.homeAutomation.devices(hubId);
      set({ devices });
    } finally {
      set({ devicesLoading: false });
    }
  },

  updateDevice: async (id, payload) => {
    const updated = await api.homeAutomation.updateDevice(id, payload);
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? updated : d)) }));
  },

  removeDevice: async (id) => {
    await api.homeAutomation.removeDevice(id);
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) }));
  },

  command: async (hubId, entityId, service) => {
    await api.homeAutomation.command(hubId, entityId, service);
    await get().loadDevices(hubId);
  },

  loadMyHubs: async () => {
    set({ loading: true });
    try {
      const hubs = await api.homeAutomation.myHubs();
      set({ hubs });
    } finally {
      set({ loading: false });
    }
  },

  loadMyDevices: async (hubId) => {
    set({ devicesLoading: true });
    try {
      const devices = await api.homeAutomation.myDevices(hubId);
      set({ devices });
    } finally {
      set({ devicesLoading: false });
    }
  },

  myCommand: async (hubId, entityId, service) => {
    await api.homeAutomation.myCommand(hubId, entityId, service);
    await get().loadMyDevices(hubId);
  },
}));
