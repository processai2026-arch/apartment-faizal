import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Per-user feature entitlements.
 *
 * FAIL-SOFT DESIGN: `features === null` means "unknown" — either not loaded yet
 * or the /me/features endpoint errored (e.g. backend not deployed during dev).
 * In that state `has()` returns true for everything so a user is never locked
 * out of the UI and the sidebar never flashes empty. Only once a real list has
 * loaded do we filter. super_admin is always entitled to everything.
 */
interface EntitlementsState {
  /** null = not loaded / failed → treat as "show all". */
  features: string[] | null;
  role: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  has: (key: string) => boolean;
  reset: () => void;
}

function isSuperAdmin(role: string | null): boolean {
  if (role === 'super_admin') return true;
  return useAuthStore.getState().user?.role === 'super_admin';
}

export const useEntitlementsStore = create<EntitlementsState>()((set, get) => ({
  features: null,
  role: null,
  loaded: false,

  load: async () => {
    try {
      const me = await api.meFeatures();
      set({ features: me.features, role: me.role, loaded: true });
    } catch {
      // Fail-soft: keep null so has() shows everything.
      set({ features: null, loaded: true });
    }
  },

  has: (key: string) => {
    const { features, role } = get();
    if (isSuperAdmin(role)) return true;
    if (features === null) return true; // not loaded / failed → show all
    return features.includes(key);
  },

  reset: () => set({ features: null, role: null, loaded: false }),
}));

/**
 * Reactive convenience hook — re-renders when entitlements or the auth role
 * change. Returns true when the given feature key is enabled for the user
 * (super_admin and the fail-soft "unknown" state always return true).
 */
export function useEntitlement(key: string): boolean {
  const features = useEntitlementsStore((s) => s.features);
  const storeRole = useEntitlementsStore((s) => s.role);
  const authRole = useAuthStore((s) => s.user?.role ?? null);
  if (authRole === 'super_admin' || storeRole === 'super_admin') return true;
  if (features === null) return true;
  return features.includes(key);
}
