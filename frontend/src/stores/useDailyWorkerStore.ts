import { create } from 'zustand';
import { api } from '@/lib/api';
import type { DailyWorker, WorkerAttendance, WorkerTodaySummary } from '@/types';

interface DailyWorkerState {
  workers: DailyWorker[];
  selectedWorker: DailyWorker | null;
  todaySummary: WorkerTodaySummary | null;
  attendanceList: WorkerAttendance[];
  loading: boolean;

  loadWorkers: (params?: Record<string, string | undefined>) => Promise<void>;
  loadWorker: (id: string) => Promise<DailyWorker>;
  createWorker: (payload: Partial<DailyWorker>) => Promise<DailyWorker>;
  updateWorker: (id: string, payload: Partial<DailyWorker>) => Promise<DailyWorker>;
  deleteWorker: (id: string) => Promise<void>;
  generateQr: (id: string) => Promise<string>;
  markAttendance: (workerId: string, status: string, notes?: string) => Promise<void>;
  loadTodaySummary: () => Promise<void>;
  loadAttendance: (params?: Record<string, string | undefined>) => Promise<void>;
  recordEntry: (workerId: string, authorizedBy?: string) => Promise<void>;
  recordExit: (workerId: string) => Promise<void>;
}

export const useDailyWorkerStore = create<DailyWorkerState>()((set) => ({
  workers: [],
  selectedWorker: null,
  todaySummary: null,
  attendanceList: [],
  loading: false,

  loadWorkers: async (params) => {
    set({ loading: true });
    try {
      const workers = await api.dailyWorkers.adminList(params);
      set({ workers });
    } finally { set({ loading: false }); }
  },

  loadWorker: async (id) => {
    const worker = await api.dailyWorkers.adminShow(id);
    set({ selectedWorker: worker });
    return worker;
  },

  createWorker: async (payload) => {
    const worker = await api.dailyWorkers.adminCreate(payload);
    set((s) => ({ workers: [worker, ...s.workers] }));
    return worker;
  },

  updateWorker: async (id, payload) => {
    const updated = await api.dailyWorkers.adminUpdate(id, payload);
    set((s) => ({ workers: s.workers.map((w) => (w.id === id ? updated : w)) }));
    return updated;
  },

  deleteWorker: async (id) => {
    await api.dailyWorkers.adminDestroy(id);
    set((s) => ({ workers: s.workers.filter((w) => w.id !== id) }));
  },

  generateQr: async (id) => {
    const qr = await api.dailyWorkers.generateQr(id);
    set((s) => ({ workers: s.workers.map((w) => w.id === id ? { ...w, qrCode: qr } : w) }));
    return qr;
  },

  markAttendance: async (workerId, status, notes) => {
    await api.dailyWorkers.markAttendance(workerId, status, notes);
  },

  loadTodaySummary: async () => {
    const todaySummary = await api.dailyWorkers.todaySummary();
    set({ todaySummary });
  },

  loadAttendance: async (params) => {
    const attendanceList = await api.dailyWorkers.attendance(params);
    set({ attendanceList });
  },

  recordEntry: async (workerId, authorizedBy) => {
    await api.dailyWorkers.recordEntry(workerId, authorizedBy);
  },

  recordExit: async (workerId) => {
    await api.dailyWorkers.recordExit(workerId);
  },
}));
