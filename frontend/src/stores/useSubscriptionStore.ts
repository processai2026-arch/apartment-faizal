import { create } from 'zustand';
import { api } from '@/lib/api';
import type { PremiumFeature, Subscription, SubscriptionDashboard, SubscriptionPlan } from '@/types';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  features: PremiumFeature[];
  dashboard: SubscriptionDashboard | null;
  myPlan: SubscriptionPlan | null;
  mySubscription: Subscription | null;
  loading: boolean;

  loadPlans: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadSubscriptions: (params?: Record<string, string | undefined>) => Promise<{ pagination?: { total: number; page: number; perPage: number; totalPages: number } }>;
  createPlan: (payload: Record<string, unknown>) => Promise<SubscriptionPlan>;
  updatePlan: (id: string, payload: Record<string, unknown>) => Promise<SubscriptionPlan>;
  deletePlan: (id: string) => Promise<void>;
  loadFeatures: () => Promise<void>;
  updateFeature: (id: string, payload: Record<string, unknown>) => Promise<PremiumFeature>;
  loadMyPlan: () => Promise<void>;
  requestUpgrade: (planId: string, billingCycle: 'Monthly' | 'Yearly') => Promise<{ status: string; message: string }>;
  cancelMyPlan: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  plans: [],
  subscriptions: [],
  features: [],
  dashboard: null,
  myPlan: null,
  mySubscription: null,
  loading: false,

  loadPlans: async () => {
    set({ loading: true });
    try {
      const result = await api.subscriptions.adminPlans();
      set({ plans: result });
    } finally {
      set({ loading: false });
    }
  },

  loadDashboard: async () => {
    set({ loading: true });
    try {
      const dashboard = await api.subscriptions.adminDashboard();
      set({ dashboard });
    } finally {
      set({ loading: false });
    }
  },

  loadSubscriptions: async (params) => {
    set({ loading: true });
    try {
      const result = await api.subscriptions.adminList(params);
      set({ subscriptions: result.items });
      return { pagination: result.pagination };
    } finally {
      set({ loading: false });
    }
  },

  createPlan: async (payload) => {
    const plan = await api.subscriptions.adminCreatePlan(payload);
    set((s) => ({ plans: [...s.plans, plan] }));
    return plan;
  },

  updatePlan: async (id, payload) => {
    const updated = await api.subscriptions.adminUpdatePlan(id, payload);
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? updated : p)),
    }));
    return updated;
  },

  deletePlan: async (id) => {
    await api.subscriptions.adminDestroyPlan(id);
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
    }));
  },

  loadFeatures: async () => {
    const features = await api.subscriptions.adminFeatures();
    set({ features });
  },

  updateFeature: async (id, payload) => {
    const updated = await api.subscriptions.adminUpdateFeature(id, payload);
    set((s) => ({
      features: s.features.map((f) => (f.id === id ? updated : f)),
    }));
    return updated;
  },

  loadMyPlan: async () => {
    set({ loading: true });
    try {
      const tenantPlans = await api.subscriptions.tenantPlans();
      // Also get current subscription
      const rawMyPlan = await api.subscriptions.myPlan();
      // rawMyPlan may be a subscription row or a { subscription: null, plan, is_free } object
      const raw = rawMyPlan as Record<string, unknown>;
      if (raw && 'is_free' in raw && raw.is_free) {
        const freePlan = tenantPlans.find((p) => p.slug === 'free') ?? null;
        set({ myPlan: freePlan, mySubscription: null });
      } else {
        const sub = rawMyPlan as unknown as Subscription;
        const plan = tenantPlans.find((p) => p.id === sub.planId) ?? null;
        set({ mySubscription: sub, myPlan: plan });
      }
    } finally {
      set({ loading: false });
    }
  },

  requestUpgrade: async (planId, billingCycle) => {
    const result = await api.subscriptions.upgrade(planId, billingCycle);
    // Refresh my plan state after upgrade request
    await get().loadMyPlan();
    return { status: result.status, message: result.message };
  },

  cancelMyPlan: async () => {
    await api.subscriptions.cancelMine();
    set({ mySubscription: null });
    const tenantPlans = await api.subscriptions.tenantPlans();
    const freePlan = tenantPlans.find((p) => p.slug === 'free') ?? null;
    set({ myPlan: freePlan });
  },
}));
