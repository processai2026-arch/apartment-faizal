// Canonical feature registry (must mirror the backend catalog keys).
//
// Maps each feature key to the nav/route PATHS it gates, across admin, tenant
// and security surfaces. Paths NOT present here are "always-on" (dashboards,
// users, offices, notifications, profile, settings, all super-admin-only items)
// and are never hidden.
//
// Used by the Sidebar (hide disabled nav items) and the route redirect guard
// (bounce direct navigation to a disabled feature back to the dashboard).

/** Feature key → list of paths that feature unlocks. */
export const pathsByFeature: Record<string, string[]> = {
  visitors: ['/visitor-passes'],
  vehicles: ['/qr-codes'],
  cctv: ['/cameras'],
  daily_workers: ['/daily-workers', '/security/daily-workers'],
  staff: ['/staff'],
  payroll: ['/payroll'],
  medical: ['/medical'],
  inventory: ['/inventory'],
  assets: ['/assets'],
  utilities: ['/utilities'],
  daily_ops: ['/daily-ops'],
  amc: ['/amc'],
  documents: ['/documents'],
  name_transfers: ['/name-transfers'],
  finance: ['/financials', '/payments'],
  expenses: ['/expenses'],
  compliance: ['/compliance'],
  reports: ['/reports'],
  analytics: ['/analytics'],
  complaints: ['/complaints', '/tenant/complaints'],
  maintenance: ['/maintenance', '/tenant/maintenance'],
  rental: ['/rental', '/tenant/rental'],
  announcements: ['/announcements', '/tenant/announcements'],
  events: ['/events', '/tenant/events'],
  emergency_contacts: ['/emergency-contacts', '/tenant/emergency-contacts', '/security/emergency-contacts'],
  vendors: ['/vendors'],
  vendor_marketplace: ['/vendor-marketplace', '/tenant/marketplace'],
  subscriptions: ['/subscriptions', '/tenant/subscription'],
  iot: ['/iot'],
  home_automation: ['/home-automation', '/tenant/home-automation'],
  whatsapp: ['/whatsapp'],
};

/** Reverse index: exact path → feature key. */
export const featureKeyForPath: Record<string, string> = Object.entries(pathsByFeature).reduce(
  (acc, [key, paths]) => {
    paths.forEach((p) => { acc[p] = key; });
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Feature key gating a nav item's exact `to`, or undefined if the item is
 * always-on. Nav `to` values match the registry paths exactly.
 */
export function featureKeyForNav(to: string): string | undefined {
  return featureKeyForPath[to];
}

// Registry paths sorted longest-first so prefix matching prefers the most
// specific entry (e.g. /tenant/rental over a hypothetical /tenant).
const REGISTERED_PATHS = Object.keys(featureKeyForPath).sort((a, b) => b.length - a.length);

/**
 * Feature key gating a full location pathname (handles nested detail routes
 * like /rental/create or /tenant/complaints/42), or undefined if always-on.
 */
export function featureKeyForLocation(pathname: string): string | undefined {
  for (const p of REGISTERED_PATHS) {
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      return featureKeyForPath[p];
    }
  }
  return undefined;
}
