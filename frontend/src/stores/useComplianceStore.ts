import { create } from 'zustand';
import { api } from '@/lib/api';
import type { GstReport, AuditReport, SuspendedLists, SuspendEntityType } from '@/types';

interface ComplianceState {
  gstReport: GstReport | null;
  auditReport: AuditReport | null;
  suspended: SuspendedLists | null;
  loading: boolean;

  loadGstReport: (from?: string, to?: string) => Promise<void>;
  loadAuditReport: (from?: string, to?: string) => Promise<void>;
  loadSuspended: () => Promise<void>;
  suspend: (entityType: SuspendEntityType, id: string, reason?: string) => Promise<void>;
  unsuspend: (entityType: SuspendEntityType, id: string) => Promise<void>;
}

export const useComplianceStore = create<ComplianceState>()((set, get) => ({
  gstReport: null,
  auditReport: null,
  suspended: null,
  loading: false,

  loadGstReport: async (from, to) => {
    set({ loading: true });
    try {
      const gstReport = await api.compliance.gstReport({ from, to });
      set({ gstReport });
    } finally { set({ loading: false }); }
  },

  loadAuditReport: async (from, to) => {
    set({ loading: true });
    try {
      const auditReport = await api.compliance.auditReport({ from, to });
      set({ auditReport });
    } finally { set({ loading: false }); }
  },

  loadSuspended: async () => {
    set({ loading: true });
    try {
      const suspended = await api.compliance.suspended();
      set({ suspended });
    } finally { set({ loading: false }); }
  },

  suspend: async (entityType, id, reason) => {
    await api.compliance.suspend(entityType, id, reason);
    await get().loadSuspended();
  },

  unsuspend: async (entityType, id) => {
    await api.compliance.unsuspend(entityType, id);
    await get().loadSuspended();
  },
}));
