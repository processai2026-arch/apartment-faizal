import { create } from 'zustand';
import { api } from '@/lib/api';
import type { IotDevice, IotEvent, IotSummary } from '@/types';

interface IotState {
  devices: IotDevice[];
  events: IotEvent[];
  summary: IotSummary | null;
  loading: boolean;
  eventsLoading: boolean;

  loadDevices: (params?: Record<string, string | undefined>) => Promise<{ pagination?: { total: number; page: number; perPage: number; totalPages: number } }>;
  loadSummary: () => Promise<void>;
  createDevice: (payload: Partial<IotDevice>) => Promise<IotDevice>;
  updateDevice: (id: string, payload: Partial<IotDevice>) => Promise<IotDevice>;
  removeDevice: (id: string) => Promise<void>;
  regenerateToken: (id: string) => Promise<string>;
  loadEvents: (params?: Record<string, string | undefined>) => Promise<{ pagination?: { total: number; page: number; perPage: number; totalPages: number } }>;
  acknowledgeEvent: (eventId: string) => Promise<IotEvent>;
}

export const useIotStore = create<IotState>()((set) => ({
  devices: [],
  events: [],
  summary: null,
  loading: false,
  eventsLoading: false,

  loadDevices: async (params) => {
    set({ loading: true });
    try {
      const result = await api.iot.devices(params);
      set({ devices: result.items });
      return { pagination: result.pagination };
    } finally {
      set({ loading: false });
    }
  },

  loadSummary: async () => {
    const summary = await api.iot.summary();
    set({ summary });
  },

  createDevice: async (payload) => {
    const device = await api.iot.createDevice(payload);
    // apiToken is present only in this response — the caller must surface it once.
    set((s) => ({ devices: [{ ...device, apiToken: undefined }, ...s.devices] }));
    return device;
  },

  updateDevice: async (id, payload) => {
    const updated = await api.iot.updateDevice(id, payload);
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? updated : d)) }));
    return updated;
  },

  removeDevice: async (id) => {
    await api.iot.removeDevice(id);
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) }));
  },

  regenerateToken: async (id) => {
    const result = await api.iot.regenerateToken(id);
    return result.apiToken;
  },

  loadEvents: async (params) => {
    set({ eventsLoading: true });
    try {
      const result = await api.iot.events(params);
      set({ events: result.items });
      return { pagination: result.pagination };
    } finally {
      set({ eventsLoading: false });
    }
  },

  acknowledgeEvent: async (eventId) => {
    const updated = await api.iot.acknowledgeEvent(eventId);
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, ...updated, deviceName: e.deviceName ?? updated.deviceName } : e)),
      summary: s.summary
        ? {
            ...s.summary,
            unacknowledgedAlerts: Math.max(0, s.summary.unacknowledgedAlerts - (updated.severity !== 'info' ? 1 : 0)),
            unacknowledgedCritical: Math.max(0, s.summary.unacknowledgedCritical - (updated.severity === 'critical' ? 1 : 0)),
          }
        : s.summary,
    }));
    return updated;
  },
}));
