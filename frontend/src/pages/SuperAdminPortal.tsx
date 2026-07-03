import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Wallet, Receipt, Wrench, Plus, Pencil, Ban, CheckCircle2,
  Megaphone, Users, BadgeDollarSign, Briefcase, ShieldCheck, SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react';
import StatCard from '@/components/features/StatCard';
import DataTable, { Column } from '@/components/features/DataTable';
import EmptyState from '@/components/features/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminStore } from '@/stores/useSuperAdminStore';
import { cn } from '@/lib/utils';
import type { Organization, OrgRollup, FeatureCatalogItem } from '@/types';

const inr = (value: number) => `₹${Number(value ?? 0).toLocaleString('en-IN')}`;

const PLAN_OPTIONS: Organization['plan'][] = ['Free', 'Standard', 'Premium'];
const STATUS_OPTIONS: Organization['status'][] = ['Active', 'Suspended', 'Trial'];

const statusClasses: Record<Organization['status'], string> = {
  Active: 'bg-green-50 text-green-700',
  Suspended: 'bg-red-50 text-red-600',
  Trial: 'bg-amber-50 text-amber-700',
};

function OrgStatusBadge({ status }: { status: Organization['status'] }) {
  return (
    <span className={cn('rounded-lg px-2 py-1 text-xs font-medium', statusClasses[status] ?? 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

// ── Organization Form Dialog ─────────────────────────────────────────────────
interface OrgFormProps {
  open: boolean;
  org: Organization | null;
  onClose: () => void;
  onSave: (payload: Partial<Organization>) => Promise<void>;
}

function OrgFormDialog({ open, org, onClose, onSave }: OrgFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<Organization['plan']>('Free');
  const [status, setStatus] = useState<Organization['status']>('Trial');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setSlug(org.slug);
      setPlan(org.plan);
      setStatus(org.status);
      setContactPerson(org.contactPerson ?? '');
      setContactEmail(org.contactEmail ?? '');
      setContactPhone(org.contactPhone ?? '');
      setAdsEnabled(org.adsEnabled);
      setNotes(org.notes ?? '');
    } else {
      setName(''); setSlug(''); setPlan('Free'); setStatus('Trial');
      setContactPerson(''); setContactEmail(''); setContactPhone('');
      setAdsEnabled(false); setNotes('');
    }
  }, [org, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name,
        slug: slug || undefined,
        plan,
        status,
        contactPerson,
        contactEmail,
        contactPhone,
        adsEnabled,
        notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{org ? 'Edit Organization' : 'Add Organization'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunrise Towers" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan</Label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as Organization['plan'])}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Organization['status'])}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Person</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={adsEnabled}
              onChange={(e) => setAdsEnabled(e.target.checked)}
              className="rounded border-slate-300"
            />
            Business advertisements enabled for this organization
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? 'Saving...' : org ? 'Save Changes' : 'Create Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Manage Features Dialog ───────────────────────────────────────────────────
interface ManageFeaturesProps {
  open: boolean;
  org: Organization | null;
  catalog: FeatureCatalogItem[];
  initial: Record<string, boolean>;
  onClose: () => void;
  onSave: (features: Record<string, boolean>) => Promise<void>;
}

function ManageFeaturesDialog({ open, org, catalog, initial, onClose, onSave }: ManageFeaturesProps) {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Seed local toggles from the org's current entitlements (default off).
    const seed: Record<string, boolean> = {};
    catalog.forEach((f) => { seed[f.key] = initial[f.key] === true; });
    setState(seed);
  }, [catalog, initial, open]);

  // Group catalog items by their `group`, preserving first-seen order.
  const grouped = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, FeatureCatalogItem[]> = {};
    catalog.forEach((f) => {
      if (!map[f.group]) { map[f.group] = []; order.push(f.group); }
      map[f.group].push(f);
    });
    return order.map((group) => ({ group, items: map[group] }));
  }, [catalog]);

  const enabledCount = catalog.filter((f) => state[f.key]).length;

  const setAll = (value: boolean) => {
    const next: Record<string, boolean> = {};
    catalog.forEach((f) => { next[f.key] = value; });
    setState(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(state);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Features{org ? ` — ${org.name}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
          <span className="font-medium text-slate-600">{enabledCount}/{catalog.length} features enabled</span>
          <div className="flex gap-2">
            <button onClick={() => setAll(true)} className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50">Enable all</button>
            <button onClick={() => setAll(false)} className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">Disable all</button>
          </div>
        </div>
        <div className="max-h-[55vh] space-y-4 overflow-y-auto py-2">
          {catalog.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">Feature catalog unavailable.</p>
          )}
          {grouped.map(({ group, items }) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group}</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {items.map((f) => (
                  <label key={f.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={state[f.key] ?? false}
                      onChange={(e) => setState((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                      className="rounded border-slate-300"
                    />
                    <span className="flex-1">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || catalog.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? 'Saving...' : 'Save Features'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SuperAdminPortal() {
  const { toast } = useToast();
  const {
    organizations, overview, featureCatalog, orgFeatures, loading,
    loadOrganizations, loadOverview, loadFeatureCatalog, loadOrgFeatures, loadAllOrgFeatures, setOrgFeatures,
    createOrganization, updateOrganization, setStatus, toggleAds,
  } = useSuperAdminStore();

  const [tab, setTab] = useState<'organizations' | 'overview'>('organizations');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [featuresOrg, setFeaturesOrg] = useState<Organization | null>(null);

  useEffect(() => {
    loadOrganizations()
      .then(() => loadAllOrgFeatures().catch(() => undefined))
      .catch(() => toast({ title: 'Could not load organizations', variant: 'destructive' }));
    loadOverview().catch(() => undefined);
    loadFeatureCatalog().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = overview?.totals;

  const featureCountFor = (org: Organization) => {
    const map = orgFeatures[org.id];
    if (!map || featureCatalog.length === 0) return null;
    const enabled = featureCatalog.filter((f) => map[f.key]).length;
    return { enabled, total: featureCatalog.length };
  };

  const openFeatures = (org: Organization) => {
    setFeaturesOrg(org);
    if (!orgFeatures[org.id]) {
      loadOrgFeatures(org.id).catch(() => toast({ title: 'Could not load features', variant: 'destructive' }));
    }
  };

  const handleSaveFeatures = async (features: Record<string, boolean>) => {
    if (!featuresOrg) return;
    try {
      await setOrgFeatures(featuresOrg.id, features);
      toast({ title: `Features updated for ${featuresOrg.name}` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      throw err;
    }
  };

  const handleSave = async (payload: Partial<Organization>) => {
    try {
      if (editing) {
        await updateOrganization(editing.id, payload);
        toast({ title: 'Organization updated' });
      } else {
        await createOrganization(payload);
        toast({ title: 'Organization created' });
      }
      loadOverview().catch(() => undefined);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      throw err;
    }
  };

  const handleStatusToggle = async (org: Organization) => {
    const next: Organization['status'] = org.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await setStatus(org.id, next);
      toast({ title: `${org.name} ${next === 'Active' ? 'activated' : 'suspended'}` });
      loadOverview().catch(() => undefined);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleAdsToggle = async (org: Organization) => {
    try {
      const updated = await toggleAds(org.id, !org.adsEnabled);
      toast({ title: `Ads ${updated.adsEnabled ? 'enabled' : 'disabled'} for ${org.name}` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const orgColumns: Column<Organization>[] = [
    {
      key: 'name',
      label: 'Organization',
      render: (org) => (
        <div>
          <p className="font-medium text-slate-900">{org.name}</p>
          <p className="text-xs text-slate-400">{org.slug}</p>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Contact',
      render: (org) => (
        <div>
          <p className="text-slate-700">{org.contactPerson || '—'}</p>
          <p className="text-xs text-slate-400">{org.contactEmail || org.contactPhone || ''}</p>
        </div>
      ),
    },
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status', render: (org) => <OrgStatusBadge status={org.status} /> },
    {
      key: 'features',
      label: 'Features',
      render: (org) => {
        const count = featureCountFor(org);
        return (
          <button
            onClick={() => openFeatures(org)}
            title="Manage features"
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {count ? `${count.enabled}/${count.total} enabled` : 'Manage'}
          </button>
        );
      },
    },
    {
      key: 'adsEnabled',
      label: 'Ads',
      render: (org) => (
        <button
          onClick={() => handleAdsToggle(org)}
          title={org.adsEnabled ? 'Disable business ads' : 'Enable business ads'}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
            org.adsEnabled ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          )}
        >
          <Megaphone className="h-3.5 w-3.5" />
          {org.adsEnabled ? 'Enabled' : 'Disabled'}
        </button>
      ),
    },
  ];

  const rollupColumns: Column<OrgRollup>[] = [
    {
      key: 'org.name',
      label: 'Organization',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.org.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs text-slate-400">{row.org.plan}</span>
            <OrgStatusBadge status={row.org.status} />
          </div>
        </div>
      ),
    },
    { key: 'users', label: 'Users' },
    { key: 'activeSubscriptions', label: 'Active Subs' },
    { key: 'subscriptionRevenue', label: 'Sub Revenue', render: (row) => inr(row.subscriptionRevenue) },
    { key: 'businessAds', label: 'Business Ads' },
    { key: 'adBillingTotal', label: 'Ad Billing', render: (row) => inr(row.adBillingTotal) },
    { key: 'vendors', label: 'Vendors' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
            <h1 className="font-[Outfit] text-2xl font-bold text-slate-900">Super Admin</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage client organizations, subscriptions, advertisements and vendors across buildings.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-1 h-4 w-4" /> Add Organization
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={totals?.organizations ?? organizations.length} icon={Building2} color="indigo" subtitle={`${totals?.users ?? 0} users total`} />
        <StatCard label="Subscription Revenue" value={inr(totals?.subscriptionRevenue ?? 0)} icon={BadgeDollarSign} color="green" subtitle={`${totals?.activeSubscriptions ?? 0} active subscriptions`} />
        <StatCard label="Ad Billing" value={inr(totals?.adBillingTotal ?? 0)} icon={Receipt} color="amber" subtitle={`${totals?.businessAds ?? 0} business ads`} />
        <StatCard label="Vendors" value={totals?.vendors ?? 0} icon={Wrench} color="blue" subtitle="across all organizations" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'organizations', label: 'Organizations', icon: Building2 },
          { key: 'overview', label: 'Customers & Billing', icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'organizations' && (
        <DataTable<Organization>
          data={organizations}
          columns={orgColumns}
          searchKeys={['name', 'slug', 'contactPerson', 'contactEmail']}
          searchPlaceholder="Search organizations..."
          empty={(
            <EmptyState
              title={loading ? 'Loading organizations...' : 'No organizations yet'}
              description={loading ? '' : 'Add your first client building to get started.'}
            />
          )}
          actions={(org) => (
            <>
              <button
                onClick={() => openFeatures(org)}
                title="Manage features"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setEditing(org); setDialogOpen(true); }}
                title="Edit"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleStatusToggle(org)}
                title={org.status === 'Suspended' ? 'Activate' : 'Suspend'}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  org.status === 'Suspended'
                    ? 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                    : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                )}
              >
                {org.status === 'Suspended' ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              </button>
            </>
          )}
        />
      )}

      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Consolidated view: customers (orgs + user counts), subscription per
              client and ad billing per client all live in the rollup table below.
              These buttons jump to the full ad-management pages. */}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/business-ads"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Briefcase className="h-4 w-4 text-indigo-500" /> Business Ads
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
            <Link
              to="/ad-billing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Receipt className="h-4 w-4 text-amber-500" /> Ad Bills
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>

          <DataTable<OrgRollup>
            data={overview?.organizations ?? []}
            columns={rollupColumns}
            rowId={(row) => row.org.id}
            hideSearch
            empty={(
              <EmptyState
                title={loading ? 'Loading overview...' : 'No data'}
                description={loading ? '' : 'Per-organization rollups (customers, subscriptions, ad bills) appear here.'}
              />
            )}
          />
        </div>
      )}

      {/* Relocated super-admin-only modules hint */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 shadow-sm">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <Briefcase className="h-4 w-4 text-indigo-500" />
          Advertisement modules
        </div>
        <p className="mt-1">
          Business Ads and Ad Billing are visible only to the super admin — find them in the
          “Super Admin” group of the sidebar.
        </p>
      </div>

      <OrgFormDialog
        open={dialogOpen}
        org={editing}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      <ManageFeaturesDialog
        open={featuresOrg !== null}
        org={featuresOrg}
        catalog={featureCatalog}
        initial={featuresOrg ? (orgFeatures[featuresOrg.id] ?? {}) : {}}
        onClose={() => setFeaturesOrg(null)}
        onSave={handleSaveFeatures}
      />
    </div>
  );
}
