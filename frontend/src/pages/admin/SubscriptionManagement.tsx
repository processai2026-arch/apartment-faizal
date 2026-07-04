import { useEffect, useState } from 'react';
import {
  Crown, Plus, Pencil, XCircle, ToggleLeft, ToggleRight,
  Users, TrendingUp, IndianRupee, BarChart3
} from 'lucide-react';
import DataTable, { type Column } from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import type { PremiumFeature, Subscription, SubscriptionPlan } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AdminTab = 'dashboard' | 'plans' | 'subscribers' | 'features';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN');
}

function KpiCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface PlanFormProps { open: boolean; plan: SubscriptionPlan | null; onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void>; }
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
      setName(plan.name); setSlug(plan.slug); setDescription(plan.description ?? '');
      setPriceMonthly(String(plan.priceMonthly)); setPriceYearly(String(plan.priceYearly));
      setFeaturesText(plan.features.join('\n')); setMaxListings(String(plan.maxListings)); setMaxAds(String(plan.maxAds));
      setAnalyticsAccess(plan.analyticsAccess); setFeaturedVendor(plan.featuredVendor);
      setFeaturedRental(plan.featuredRental); setPrioritySupport(plan.prioritySupport);
    } else {
      setName(''); setSlug(''); setDescription(''); setPriceMonthly('0'); setPriceYearly('0');
      setFeaturesText(''); setMaxListings('3'); setMaxAds('1');
      setAnalyticsAccess(false); setFeaturedVendor(false); setFeaturedRental(false); setPrioritySupport(false);
    }
  }, [plan, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name, slug, description: description || null,
        price_monthly: parseFloat(priceMonthly) || 0, price_yearly: parseFloat(priceYearly) || 0,
        features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
        max_listings: parseInt(maxListings) || 3, max_ads: parseInt(maxAds) || 1,
        analytics_access: analyticsAccess ? 1 : 0, featured_vendor: featuredVendor ? 1 : 0,
        featured_rental: featuredRental ? 1 : 0, priority_support: prioritySupport ? 1 : 0, is_active: 1,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{plan ? 'Edit Plan' : 'Add Plan'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Price Monthly (₹)</Label><Input type="number" value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} /></div>
            <div><Label>Price Yearly (₹)</Label><Input type="number" value={priceYearly} onChange={e => setPriceYearly(e.target.value)} /></div>
          </div>
          <div><Label>Features (one per line)</Label><Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={4} placeholder="Unlimited listings&#10;Priority support&#10;..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Max Listings (-1 = unlimited)</Label><Input type="number" value={maxListings} onChange={e => setMaxListings(e.target.value)} /></div>
            <div><Label>Max Ads (-1 = unlimited)</Label><Input type="number" value={maxAds} onChange={e => setMaxAds(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Analytics Access', val: analyticsAccess, set: setAnalyticsAccess },
              { label: 'Featured Vendor', val: featuredVendor, set: setFeaturedVendor },
              { label: 'Featured Rental', val: featuredRental, set: setFeaturedRental },
              { label: 'Priority Support', val: prioritySupport, set: setPrioritySupport },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name || !slug} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const { plans, subscriptions, features, dashboard, loadPlans, loadDashboard, loadSubscriptions, loadFeatures, createPlan, updatePlan, deletePlan, updateFeature } = useSubscriptionStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { void loadDashboard(); void loadPlans(); void loadSubscriptions(); void loadFeatures(); }, [loadDashboard, loadPlans, loadSubscriptions, loadFeatures]);

  const handleSavePlan = async (payload: Record<string, unknown>) => {
    try {
      if (editingPlan) { await updatePlan(editingPlan.id, payload); toast({ title: 'Plan updated' }); }
      else { await createPlan(payload); toast({ title: 'Plan created' }); }
      setEditingPlan(null);
    } catch (err) { toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' }); throw err; }
  };

  const handleDeactivatePlan = async (plan: SubscriptionPlan) => {
    try { setLoading(true); await deletePlan(plan.id); toast({ title: 'Plan deactivated' }); }
    catch (err) { toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleToggleFeature = async (feature: PremiumFeature) => {
    try { await updateFeature(feature.id, { is_active: feature.isActive ? 0 : 1 }); toast({ title: feature.isActive ? 'Feature disabled' : 'Feature enabled' }); }
    catch (err) { toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' }); }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' }, { id: 'plans', label: 'Plans' },
    { id: 'subscribers', label: 'Subscribers' }, { id: 'features', label: 'Premium Features' },
  ];

  const planColors: Record<string, string> = { Free: 'bg-slate-500', Premium: 'bg-indigo-600', Enterprise: 'bg-purple-600' };
  const planBorder: Record<string, string> = { Free: 'border-slate-200', Premium: 'border-indigo-200', Enterprise: 'border-purple-200' };

  const subscriberColumns: Column<Subscription>[] = [
    { key: 'id', label: 'ID', render: (s) => <span className="text-xs text-slate-400">#{s.id}</span> },
    { key: 'userId', label: 'User', render: (s) => <span className="font-medium text-slate-900">{(s as Subscription & { user_name?: string }).user_name ?? `User #${s.userId}`}</span> },
    { key: 'planName', label: 'Plan', render: (s) => <span className="font-medium text-indigo-600">{s.planName ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'billingCycle', label: 'Billing', render: (s) => <span className="text-slate-600">{s.billingCycle}</span> },
    { key: 'amountPaid', label: 'Amount', render: (s) => <span className="font-semibold text-green-600">{formatCurrency(s.amountPaid)}</span> },
    { key: 'expiresAt', label: 'Expires', render: (s) => <span className="text-slate-500 text-xs">{formatDate(s.expiresAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Subscription Management</h1>
          <p className="text-sm text-slate-500">Manage plans, subscribers, and premium features</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard title="Total Subscribers" value={dashboard?.totalSubscribers ?? 0} icon={Users} color="bg-indigo-600" />
            <KpiCard title="Active Subscriptions" value={dashboard?.active ?? 0} icon={TrendingUp} color="bg-green-600" />
            <KpiCard title="Monthly Recurring Revenue" value={formatCurrency(dashboard?.mrr ?? 0)} icon={IndianRupee} color="bg-amber-500" />
            <KpiCard title="Plans Available" value={plans.filter(p => p.isActive).length} icon={BarChart3} color="bg-purple-600" />
          </div>

          {dashboard?.byPlan && Object.keys(dashboard.byPlan).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Subscribers by Plan</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(dashboard.byPlan).map(([planName, count]) => (
                  <div key={planName} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${planColors[planName] ?? 'bg-slate-400'}`} />
                    <span className="text-slate-600">{planName}:</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard?.recentSubscriptions && dashboard.recentSubscriptions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Recent Subscriptions</h3>
              <div className="space-y-3">
                {dashboard.recentSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{(sub as Subscription & { user_name?: string }).user_name ?? `User #${sub.userId}`}</p>
                      <p className="text-xs text-slate-500">{sub.planName} — {sub.billingCycle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(sub.amountPaid)}</span>
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4" /> Add Plan
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className={cn('bg-white rounded-xl border-2 shadow-sm p-5', planBorder[plan.name] ?? 'border-slate-200', !plan.isActive && 'opacity-50')}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white mb-2 ${planColors[plan.name] ?? 'bg-slate-500'}`}>{plan.name}</span>
                    <p className="text-xs text-slate-500">{plan.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true); }} className="rounded p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil className="h-4 w-4" /></button>
                    {plan.isActive && <button onClick={() => handleDeactivatePlan(plan)} disabled={loading} className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50"><XCircle className="h-4 w-4" /></button>}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-slate-900">
                    {plan.priceMonthly === 0 ? 'Free' : formatCurrency(plan.priceMonthly)}
                    {plan.priceMonthly > 0 && <span className="text-sm font-normal text-slate-500">/mo</span>}
                  </p>
                  {plan.priceYearly > 0 && <p className="text-xs text-slate-500">{formatCurrency(plan.priceYearly)}/yr</p>}
                </div>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600"><span className="text-green-500">✓</span> {f}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1">
                  {plan.analyticsAccess && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Analytics</span>}
                  {plan.featuredVendor && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Featured Vendor</span>}
                  {plan.prioritySupport && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Priority Support</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribers */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <DataTable data={subscriptions} columns={subscriberColumns} empty={<div className="p-8 text-center text-sm text-slate-500">No subscriptions found</div>} />
        </div>
      )}

      {/* Features */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-slate-900">{feature.featureName}</p>
                  <p className="text-xs text-slate-500">{feature.description}</p>
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Min plan: {feature.minPlan}</span>
                </div>
                <button onClick={() => handleToggleFeature(feature)} title={feature.isActive ? 'Disable' : 'Enable'}>
                  {feature.isActive ? <ToggleRight className="h-7 w-7 text-green-500" /> : <ToggleLeft className="h-7 w-7 text-slate-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <PlanFormDialog open={planDialogOpen} plan={editingPlan} onClose={() => { setPlanDialogOpen(false); setEditingPlan(null); }} onSave={handleSavePlan} />
    </div>
  );
}
