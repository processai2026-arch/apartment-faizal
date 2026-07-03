import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Organization, SuperAdminOverview, FeatureCatalogItem } from '@/types';

interface SuperAdminState {
  organizations: Organization[];
  overview: SuperAdminOverview | null;
  featureCatalog: FeatureCatalogItem[];
  /** orgId → { featureKey: enabled }. Populated lazily. */
  orgFeatures: Record<string, Record<string, boolean>>;
  loading: boolean;

  loadOrganizations: () => Promise<void>;
  loadOverview: () => Promise<void>;
  loadFeatureCatalog: () => Promise<void>;
  loadOrgFeatures: (id: string) => Promise<Record<string, boolean>>;
  loadAllOrgFeatures: () => Promise<void>;
  setOrgFeatures: (id: string, features: Record<string, boolean>) => Promise<void>;
  createOrganization: (payload: Partial<Organization>) => Promise<Organization>;
  updateOrganization: (id: string, payload: Partial<Organization>) => Promise<Organization>;
  setStatus: (id: string, status: Organization['status']) => Promise<Organization>;
  toggleAds: (id: string, enabled: boolean) => Promise<Organization>;
  removeOrganization: (id: string) => Promise<void>;
  assignUser: (orgId: string, userId: string) => Promise<void>;
}

export const useSuperAdminStore = create<SuperAdminState>()((set, get) => ({
  organizations: [],
  overview: null,
  featureCatalog: [],
  orgFeatures: {},
  loading: false,

  loadOrganizations: async () => {
    set({ loading: true });
    try {
      const organizations = await api.superAdmin.organizations();
      set({ organizations });
    } finally {
      set({ loading: false });
    }
  },

  loadOverview: async () => {
    set({ loading: true });
    try {
      const overview = await api.superAdmin.overview();
      set({ overview });
    } finally {
      set({ loading: false });
    }
  },

  loadFeatureCatalog: async () => {
    const featureCatalog = await api.superAdmin.featureCatalog();
    set({ featureCatalog });
  },

  loadOrgFeatures: async (id) => {
    const result = await api.superAdmin.orgFeatures(id);
    set((s) => ({ orgFeatures: { ...s.orgFeatures, [id]: result.features } }));
    return result.features;
  },

  loadAllOrgFeatures: async () => {
    const orgs = get().organizations;
    const entries = await Promise.all(
      orgs.map(async (org) => {
        try {
          const result = await api.superAdmin.orgFeatures(org.id);
          return [org.id, result.features] as const;
        } catch {
          return null;
        }
      }),
    );
    set((s) => {
      const next = { ...s.orgFeatures };
      entries.forEach((entry) => { if (entry) next[entry[0]] = entry[1]; });
      return { orgFeatures: next };
    });
  },

  setOrgFeatures: async (id, features) => {
    const result = await api.superAdmin.setOrgFeatures(id, features);
    set((s) => ({ orgFeatures: { ...s.orgFeatures, [id]: result.features } }));
  },

  createOrganization: async (payload) => {
    const org = await api.superAdmin.createOrganization(payload);
    set((s) => ({ organizations: [...s.organizations, org] }));
    return org;
  },

  updateOrganization: async (id, payload) => {
    const updated = await api.superAdmin.updateOrganization(id, payload);
    set((s) => ({ organizations: s.organizations.map((o) => (o.id === id ? updated : o)) }));
    return updated;
  },

  setStatus: async (id, status) => {
    const updated = await api.superAdmin.setOrganizationStatus(id, status);
    set((s) => ({ organizations: s.organizations.map((o) => (o.id === id ? updated : o)) }));
    return updated;
  },

  toggleAds: async (id, enabled) => {
    const updated = await api.superAdmin.updateOrganization(id, { adsEnabled: enabled });
    set((s) => ({ organizations: s.organizations.map((o) => (o.id === id ? updated : o)) }));
    return updated;
  },

  removeOrganization: async (id) => {
    await api.superAdmin.removeOrganization(id);
    set((s) => ({ organizations: s.organizations.filter((o) => o.id !== id) }));
  },

  assignUser: async (orgId, userId) => {
    await api.superAdmin.assignUser(orgId, userId);
    // Rollups change when users move between organizations.
    await get().loadOverview().catch(() => undefined);
  },
}));
