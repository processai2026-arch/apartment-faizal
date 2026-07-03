import { useEffect, useState } from 'react';
import {
  Crown, Plus, Pencil, XCircle, ToggleLeft, ToggleRight,
  Users, TrendingUp, IndianRupee, BarChart3
} from 'lucide-react';
import DataTable, { Column } from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import type { PremiumFeature, Subscription, SubscriptionPlan } from '@/types';
import { useToast } from '@/hooks/use-toast';

type AdminTab = 'dashboard' | 'plans' | 'subscribers' | 'features';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN');
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}
function KpiCard({ title, value, icon: Icon, color }: KpiProps) {
  return (
    <Card className="border-slate-700 bg-slate-800/60 p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-slate-400">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Plan Form Dialog ──────────────────────────────────────────────────────────
interface PlanFormProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}
function PlanFormDialog({ open, plan, onClose, onSave }: PlanFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('0');
  const [priceYearly, setPriceYearly] = useState('0');
  const [featuresText, setFeaturesText] = useState('');
  const [maxListings, setMaxListings] = useState('3');
  const [maxAds, setMaxAds] = useState('1');
  const [analyticsAccess, setAnalyticsAccess] = useState(false);
  const [featuredVendor, setFeaturedVendor] = useState(false);
  const [featuredRental, setFeaturedRental] = useState(false);
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setDescription(plan.description ?? '');
      setPriceMonthly(String(plan.priceMonthly));
      setPriceYearly(String(plan.priceYearly));
      setFeaturesText(plan.features.join('\n'));
      setMaxListings(String(plan.maxListings));
      setMaxAds(String(plan.maxAds));
      setAnalyticsAccess(plan.analyticsAccess);
      setFeaturedVendor(plan.featuredVendor);
      setFeaturedRental(plan.featuredRental);
      setPrioritySupport(plan.prioritySupport);
    } else {
      setName(''); setSlug(''); setDescription('');
      setPriceMonthly('0'); setPriceYearly('0'); setFeaturesText('');
      setMaxListings('3'); setMaxAds('1');
      setAnalyticsAccess(false); setFeaturedVendor(false);
      setFeaturedRental(false); setPrioritySupport(false);
    }
  }, [plan, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
      await onSave({
        name, slug, description: description || null,
        price_monthly: parseFloat(priceMonthly) || 0,
        price_yearly: parseFloat(priceYearly) || 0,
        features,
        max_listings: parseInt(maxListings) || 3,
        max_ads: parseInt(maxAds) || 1,
        analytics_access: analyticsAccess ? 1 : 0,
        featured_vendor: featuredVendor ? 1 : 0,
        featured_rental: featuredRental ? 1 : 0,
        priority_support: prioritySupport ? 1 : 0,
        is_active: 1,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-slate-700 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{plan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="border-slate-700 bg-slate-800 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} className="border-slate-700 bg-slate-800 text-white" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="border-slate-700 bg-slate-800 text-white" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Price Monthly (₹)</Label>
              <Input type="number" value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} className="border-slate-700 bg-slate-800 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Price Yearly (₹)</Label>
              <Input type="number" value={priceYearly} onChange={e => setPriceYearly(e.target.value)} className="border-slate-700 bg-slate-800 text-white" />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Features (one per line)</Label>
            <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} className="border-slate-700 bg-slate-800 text-white" rows={4} placeholder="Unlimited listings&#10;Priority support&#10;..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300">Max Listings (-1 = unlimited)</Label>
              <Input type="number" value={maxListings} onChange={e => setMaxListings(e.target.value)} className="border-slate-700 bg-slate-800 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Max Ads (-1 = unlimited)</Label>
              <Input type="number" value={maxAds} onChange={e => setMaxAds(e.target.value)} className="border-slate-700 bg-slate-800 text-white" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Analytics Access', val: analyticsAccess, set: setAnalyticsAccess },
              { label: 'Featured Vendor', val: featuredVendor, set: setFeaturedVendor },
              { label: 'Featured Rental', val: featuredRental, set: setFeaturedRental },
              { label: 'Priority Support', val: prioritySupport, set: setPrioritySupport },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name || !slug} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubscriptionManagement() {
  const { toast } = useToast();
  const {
    plans, subscriptions, features, dashboard,
    loadPlans, loadDashboard, loadSubscriptions, loadFeatures,
    createPlan, updatePlan, deletePlan, updateFeature,
  } = useSubscriptionStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadDashboard();
    void loadPlans();
    void loadSubscriptions();
    void loadFeatures();
  }, [loadDashboard, loadPlans, loadSubscriptions, loadFeatures]);

  const handleSavePlan = async (payload: Record<string, unknown>) => {
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
        toast({ title: 'Plan updated' });
      } else {
        await createPlan(payload);
        toast({ title: 'Plan created' });
      }
      setEditingPlan(null);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      throw err;
    }
  };

  const handleDeactivatePlan = async (plan: SubscriptionPlan) => {
    try {
      setLoading(true);
      await deletePlan(plan.id);
      toast({ title: 'Plan deactivated' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (feature: PremiumFeature) => {
    try {
      await updateFeature(feature.id, { is_active: feature.isActive ? 0 : 1 });
      toast({ title: feature.isActive ? 'Feature disabled' : 'Feature enabled' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'plans', label: 'Plans' },
    { id: 'subscribers', label: 'Subscribers' },
    { id: 'features', label: 'Premium Features' },
  ];

  const subscriberColumns: Column<Subscription>[] = [
    { key: 'id', label: 'ID', render: (s) => <span className="text-xs text-slate-400">#{s.id}</span> },
    { key: 'userId', label: 'User', render: (s) => <span className="text-white">{(s as Subscription & { user_name?: string }).user_name ?? `User #${s.userId}`}</span> },
    { key: 'planName', label: 'Plan', render: (s) => <span className="font-medium text-indigo-400">{s.planName ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (s) => (
      <StatusBadge status={s.status} />
    )},
    { key: 'billingCycle', label: 'Billing', render: (s) => <span className="text-slate-300">{s.billingCycle}</span> },
    { key: 'amountPaid', label: 'Amount', render: (s) => <span className="text-green-400">{formatCurrency(s.amountPaid)}</span> },
    { key: 'expiresAt', label: 'Expires', render: (s) => <span className="text-slate-400 text-xs">{formatDate(s.expiresAt)}</span> },
  ];

  const planColors: Record<string, string> = {
    Free: 'bg-slate-600',
    Premium: 'bg-indigo-600',
    Enterprise: 'bg-purple-600',
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
          <p className="text-sm text-slate-400">Manage plans, subscribers, and premium features</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard title="Total Subscribers" value={dashboard?.totalSubscribers ?? 0} icon={Users} color="bg-indigo-600" />
            <KpiCard title="Active Subscriptions" value={dashboard?.active ?? 0} icon={TrendingUp} color="bg-green-600" />
            <KpiCard title="Monthly Recurring Revenue" value={formatCurrency(dashboard?.mrr ?? 0)} icon={IndianRupee} color="bg-amber-600" />
            <KpiCard title="Plans Available" value={plans.filter(p => p.isActive).length} icon={BarChart3} color="bg-purple-600" />
          </div>

          {/* By Plan Distribution */}
          {dashboard?.byPlan && Object.keys(dashboard.byPlan).length > 0 && (
            <Card className="border-slate-700 bg-slate-800/60 p-5">
              <h3 className="mb-4 font-semibold text-white">Subscribers by Plan</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(dashboard.byPlan).map(([planName, count]) => (
                  <div key={planName} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${planColors[planName] ?? 'bg-slate-600'}`} />
                    <span className="text-slate-300">{planName}:</span>
                    <span className="font-semibold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Subscriptions */}
          {dashboard?.recentSubscriptions && dashboard.recentSubscriptions.length > 0 && (
            <Card className="border-slate-700 bg-slate-800/60 p-5">
              <h3 className="mb-4 font-semibold text-white">Recent Subscriptions</h3>
              <div className="space-y-3">
                {dashboard.recentSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-white">{(sub as Subscription & { user_name?: string }).user_name ?? `User #${sub.userId}`}</p>
                      <p className="text-xs text-slate-400">{sub.planName} — {sub.billingCycle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-400">{formatCurrency(sub.amountPaid)}</span>
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Plan
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={`border-slate-700 bg-slate-800/60 p-5 ${!plan.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${planColors[plan.name] ?? 'bg-slate-600'}`}>
                      {plan.name}
                    </div>
                    <p className="text-xs text-slate-400">{plan.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true); }}
                      className="rounded p-1 text-slate-400 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {plan.isActive && (
                      <button
                        onClick={() => handleDeactivatePlan(plan)}
                        disabled={loading}
                        className="rounded p-1 text-slate-400 hover:text-red-400"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white">
                    {plan.priceMonthly === 0 ? 'Free' : formatCurrency(plan.priceMonthly)}
                    {plan.priceMonthly > 0 && <span className="text-sm font-normal text-slate-400">/mo</span>}
                  </p>
                  {plan.priceYearly > 0 && (
                    <p className="text-xs text-slate-400">{formatCurrency(plan.priceYearly)}/yr</p>
                  )}
                </div>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1">
                  {plan.analyticsAccess && <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">Analytics</span>}
                  {plan.featuredVendor && <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">Featured Vendor</span>}
                  {plan.prioritySupport && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Priority Support</span>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <DataTable
          data={subscriptions}
          columns={subscriberColumns}
          empty={<div className="p-8 text-center text-sm text-slate-400">No subscriptions found</div>}
        />
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <Card className="border-slate-700 bg-slate-800/60">
          <div className="divide-y divide-slate-700">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-white">{feature.featureName}</p>
                  <p className="text-xs text-slate-400">{feature.description}</p>
                  <span className="mt-1 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    Min plan: {feature.minPlan}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleFeature(feature)}
                  className="text-slate-400 hover:text-white"
                  title={feature.isActive ? 'Disable' : 'Enable'}
                >
                  {feature.isActive
                    ? <ToggleRight className="h-7 w-7 text-green-400" />
                    : <ToggleLeft className="h-7 w-7 text-slate-500" />}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Plan Form Dialog */}
      <PlanFormDialog
        open={planDialogOpen}
        plan={editingPlan}
        onClose={() => { setPlanDialogOpen(false); setEditingPlan(null); }}
        onSave={handleSavePlan}
      />
    </div>
  );
}
