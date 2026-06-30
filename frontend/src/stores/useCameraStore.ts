import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CameraDevice, CameraEvent, CameraSnapshot, CameraDashboard } from '@/types';

interface CameraState {
  cameras: CameraDevice[];
  selectedCamera: CameraDevice | null;
  dashboard: CameraDashboard | null;
  events: CameraEvent[];
  snapshots: CameraSnapshot[];
  timeline: (CameraEvent | CameraSnapshot | Record<string, unknown>)[];
  loading: boolean;

  loadCameras: (params?: Record<string, string | undefined>) => Promise<{ pagination?: { total: number; page: number; perPage: number; totalPages: number } }>;
  loadDashboard: () => Promise<void>;
  loadCamera: (id: string) => Promise<CameraDevice>;
  createCamera: (payload: Partial<CameraDevice> & { password?: string }) => Promise<CameraDevice>;
  updateCamera: (id: string, payload: Partial<CameraDevice> & { password?: string }) => Promise<CameraDevice>;
  removeCamera: (id: string) => Promise<void>;
  sendHeartbeat: (id: string) => Promise<CameraDevice>;
  loadEvents: (id: string, params?: Record<string, string | undefined>) => Promise<void>;
  logEvent: (id: string, payload: { eventType: string; severity?: string; description?: string; occurredAt?: string }) => Promise<CameraEvent>;
  acknowledgeEvent: (eventId: string) => Promise<CameraEvent>;
  loadSnapshots: (id: string) => Promise<void>;
  createSnapshot: (id: string, notes?: string) => Promise<CameraSnapshot>;
  loadTimeline: (id: string) => Promise<void>;
}

export const useCameraStore = create<CameraState>()((set, get) => ({
  cameras: [],
  selectedCamera: null,
  dashboard: null,
  events: [],
  snapshots: [],
  timeline: [],
  loading: false,

  loadCameras: async (params) => {
    set({ loading: true });
    try {
      const result = await api.cameras.list(params);
      set({ cameras: result.items });
      return { pagination: result.pagination };
    } finally {
      set({ loading: false });
    }
  },

  loadDashboard: async () => {
    set({ loading: true });
    try {
      const dashboard = await api.cameras.dashboard();
      set({ dashboard });
    } finally {
      set({ loading: false });
    }
  },

  loadCamera: async (id) => {
    set({ loading: true });
    try {
      const camera = await api.cameras.show(id);
      set({ selectedCamera: camera });
      return camera;
    } finally {
      set({ loading: false });
    }
  },

  createCamera: async (payload) => {
    const camera = await api.cameras.create(payload);
    set((s) => ({ cameras: [camera, ...s.cameras] }));
    return camera;
  },

  updateCamera: async (id, payload) => {
    const updated = await api.cameras.update(id, payload);
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === id ? updated : c)),
      selectedCamera: s.selectedCamera?.id === id ? updated : s.selectedCamera,
    }));
    return updated;
  },

  removeCamera: async (id) => {
    await api.cameras.remove(id);
    set((s) => ({
      cameras: s.cameras.filter((c) => c.id !== id),
      selectedCamera: s.selectedCamera?.id === id ? null : s.selectedCamera,
    }));
  },

  sendHeartbeat: async (id) => {
    const updated = await api.cameras.heartbeat(id);
    set((s) => ({
      cameras: s.cameras.map((c) => (c.id === id ? updated : c)),
      selectedCamera: s.selectedCamera?.id === id ? updated : s.selectedCamera,
    }));
    return updated;
  },

  loadEvents: async (id, params) => {
    set({ loading: true });
    try {
      const result = await api.cameras.events(id, params);
      set({ events: result.items });
    } finally {
      set({ loading: false });
    }
  },

  logEvent: async (id, payload) => {
    const event = await api.cameras.createEvent(id, payload);
    set((s) => ({ events: [event, ...s.events] }));
    return event;
  },

  acknowledgeEvent: async (eventId) => {
    const updated = await api.cameras.acknowledgeEvent(eventId);
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? updated : e)),
      dashboard: s.dashboard
        ? {
            ...s.dashboard,
            unacknowledgedEvents: Math.max(0, s.dashboard.unacknowledgedEvents - 1),
            recentEvents: s.dashboard.recentEvents.map((e) => (e.id === eventId ? updated : e)),
          }
        : s.dashboard,
    }));
    return updated;
  },

  loadSnapshots: async (id) => {
    set({ loading: true });
    try {
      const result = await api.cameras.snapshots(id);
      set({ snapshots: result.items });
    } finally {
      set({ loading: false });
    }
  },

  createSnapshot: async (id, notes) => {
    const snapshot = await api.cameras.createSnapshot(id, notes);
    set((s) => ({ snapshots: [snapshot, ...s.snapshots] }));
    return snapshot;
  },

  loadTimeline: async (id) => {
    set({ loading: true });
    try {
      const items = await api.cameras.timeline(id);
      set({ timeline: items as (CameraEvent | CameraSnapshot | Record<string, unknown>)[] });
    } finally {
      set({ loading: false });
    }
  },
}));
