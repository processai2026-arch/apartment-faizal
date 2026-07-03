import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CctvChecklist, CctvCheckStatus, DailyOpsReport, EbLog, HousekeepingLog, WaterLorryLog } from '@/types';

interface DailyOpsState {
  report: DailyOpsReport | null;
  checklist: CctvChecklist | null;
  waterLogs: WaterLorryLog[];
  ebLogs: EbLog[];
  housekeepingLogs: HousekeepingLog[];
  loading: boolean;

  loadReport: (date: string) => Promise<void>;
  loadChecklist: (date: string) => Promise<void>;
  saveChecklistBulk: (date: string, checks: { cameraId: string; status: CctvCheckStatus; remarks?: string }[]) => Promise<void>;

  loadWaterLogs: (date: string) => Promise<void>;
  createWaterLog: (payload: Partial<WaterLorryLog>) => Promise<WaterLorryLog>;
  updateWaterLog: (id: string, payload: Partial<WaterLorryLog>) => Promise<WaterLorryLog>;
  deleteWaterLog: (id: string) => Promise<void>;

  loadEbLogs: (date: string) => Promise<void>;
  createEbLog: (payload: Partial<EbLog>) => Promise<EbLog>;
  updateEbLog: (id: string, payload: Partial<EbLog>) => Promise<EbLog>;
  deleteEbLog: (id: string) => Promise<void>;

  loadHousekeepingLogs: (date: string) => Promise<void>;
  createHousekeepingLog: (payload: Partial<HousekeepingLog>) => Promise<HousekeepingLog>;
  updateHousekeepingLog: (id: string, payload: Partial<HousekeepingLog>) => Promise<HousekeepingLog>;
  deleteHousekeepingLog: (id: string) => Promise<void>;
}

export const useDailyOpsStore = create<DailyOpsState>()((set) => ({
  report: null,
  checklist: null,
  waterLogs: [],
  ebLogs: [],
  housekeepingLogs: [],
  loading: false,

  loadReport: async (date) => {
    set({ loading: true });
    try {
      const report = await api.dailyOps.report(date);
      set({ report });
    } finally { set({ loading: false }); }
  },

  loadChecklist: async (date) => {
    set({ loading: true });
    try {
      const checklist = await api.dailyOps.cctvChecklist(date);
      set({ checklist });
    } finally { set({ loading: false }); }
  },

  saveChecklistBulk: async (date, checks) => {
    const checklist = await api.dailyOps.saveCctvChecksBulk(date, checks);
    set({ checklist });
  },

  loadWaterLogs: async (date) => {
    const result = await api.dailyOps.waterLorryList({ date });
    set({ waterLogs: result.items });
  },

  createWaterLog: async (payload) => {
    const log = await api.dailyOps.waterLorryCreate(payload);
    set((s) => ({ waterLogs: [...s.waterLogs, log] }));
    return log;
  },

  updateWaterLog: async (id, payload) => {
    const updated = await api.dailyOps.waterLorryUpdate(id, payload);
    set((s) => ({ waterLogs: s.waterLogs.map((l) => (l.id === id ? updated : l)) }));
    return updated;
  },

  deleteWaterLog: async (id) => {
    await api.dailyOps.waterLorryDestroy(id);
    set((s) => ({ waterLogs: s.waterLogs.filter((l) => l.id !== id) }));
  },

  loadEbLogs: async (date) => {
    const result = await api.dailyOps.ebList({ date });
    set({ ebLogs: result.items });
  },

  createEbLog: async (payload) => {
    const log = await api.dailyOps.ebCreate(payload);
    set((s) => ({ ebLogs: [...s.ebLogs, log] }));
    return log;
  },

  updateEbLog: async (id, payload) => {
    const updated = await api.dailyOps.ebUpdate(id, payload);
    set((s) => ({ ebLogs: s.ebLogs.map((l) => (l.id === id ? updated : l)) }));
    return updated;
  },

  deleteEbLog: async (id) => {
    await api.dailyOps.ebDestroy(id);
    set((s) => ({ ebLogs: s.ebLogs.filter((l) => l.id !== id) }));
  },

  loadHousekeepingLogs: async (date) => {
    const result = await api.dailyOps.housekeepingList({ date });
    set({ housekeepingLogs: result.items });
  },

  createHousekeepingLog: async (payload) => {
    const log = await api.dailyOps.housekeepingCreate(payload);
    set((s) => ({ housekeepingLogs: [...s.housekeepingLogs, log] }));
    return log;
  },

  updateHousekeepingLog: async (id, payload) => {
    const updated = await api.dailyOps.housekeepingUpdate(id, payload);
    set((s) => ({ housekeepingLogs: s.housekeepingLogs.map((l) => (l.id === id ? updated : l)) }));
    return updated;
  },

  deleteHousekeepingLog: async (id) => {
    await api.dailyOps.housekeepingDestroy(id);
    set((s) => ({ housekeepingLogs: s.housekeepingLogs.filter((l) => l.id !== id) }));
  },
}));
