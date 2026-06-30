import { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, DollarSign, Package, Download, Plus, RefreshCcw, Pencil, Trash2, CheckCircle, Eye, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/features/StatusBadge';
import MiniChart from '@/components/features/MiniChart';
import { api } from '@/lib/api';
import type { AdAnalytics, AdBilling, AdPackage, BillingSummary, AdExportRow } from '@/types';

type Tab = 'analytics' | 'billing' | 'packages' | 'export';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString();
}

function currency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function jsonToCsv(rows: AdExportRow[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]) as (keyof AdExportRow)[];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = r[h];
        if (val === null || val === undefined) return '';
        const s = String(val);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    ),
  ];
  return lines.join('\r\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── KPI Card ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}

function KpiCard({ label, value, icon: Icon, color, sub }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Billing Status Badge override ──────────────────────────────────────────

function BillingStatusBadge({ status }: { status: AdBilling['billingStatus'] }) {
  const map: Record<AdBilling['billingStatus'], string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Paid: 'bg-emerald-100 text-emerald-700',
    Overdue: 'bg-rose-100 text-rose-700',
    Waived: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', map[status] ?? map['Pending'])}>
      {status}
    </span>
  );
}

// ── Package Form Dialog ────────────────────────────────────────────────────

interface PackageFormProps {
  pkg: Partial<AdPackage> | null;
  onClose: () => void;
  onSaved: () => void;
}

function PackageForm({ pkg, onClose, onSaved }: PackageFormProps) {
  const [form, setForm] = useState<Partial<AdPackage>>(pkg ?? {});
  const [saving, setSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState<string>(
    pkg?.features?.join('\n') ?? ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const features = featuresText.split('\n').map((s) => s.trim()).filter(Boolean);
      if (form.id) {
        await api.adBilling.updatePackage(form.id, { ...form, features });
        toast.success('Package updated');
      } else {
        await api.adBilling.createPackage({ ...form, features });
        toast.success('Package created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">
          {form.id ? 'Edit Package' : 'New Ad Package'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input required value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Price (₹) *</label>
              <input required type="number" min={0} step={1} value={form.price ?? ''} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (days)</label>
              <input type="number" min={1} value={form.durationDays ?? 30} onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Max Impressions (0 = unlimited)</label>
            <input type="number" min={0} value={form.maxImpressions ?? 0} onChange={(e) => setForm((f) => ({ ...f, maxImpressions: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Features (one per line)</label>
            <textarea rows={4} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="30-day listing&#10;Standard placement&#10;Click tracking"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pkg-active" checked={form.isActive !== false} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <label htmlFor="pkg-active" className="text-sm text-slate-700 dark:text-slate-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Billing Dialog ─────────────────────────────────────────────────────

interface AddBillingFormProps {
  packages: AdPackage[];
  onClose: () => void;
  onSaved: () => void;
}

function AddBillingForm({ packages, onClose, onSaved }: AddBillingFormProps) {
  const [adId, setAdId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-fill amount when package selected
  useEffect(() => {
    if (packageId) {
      const pkg = packages.find((p) => p.id === packageId);
      if (pkg) setAmount(String(pkg.price));
    }
  }, [packageId, packages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adId || !amount) { toast.error('Ad ID and amount are required'); return; }
    setSaving(true);
    try {
      await api.adBilling.create({
        adId,
        packageId: packageId || undefined,
        amount: Number(amount),
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      });
      toast.success('Billing record created');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Add Billing Record</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Ad ID *</label>
            <input required type="number" min={1} value={adId} onChange={(e) => setAdId(e.target.value)} placeholder="Enter ad ID"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Package</label>
            <select value={packageId} onChange={(e) => setPackageId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="">None</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name} — {currency(p.price)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹) *</label>
              <input required type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdBillingAnalytics() {
  const [tab, setTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null);
  const [billingRows, setBillingRows] = useState<AdBilling[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [exportRows, setExportRows] = useState<AdExportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pkgForm, setPkgForm] = useState<Partial<AdPackage> | null>(null);
  const [addBillingOpen, setAddBillingOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await api.businessAds.analytics();
      setAnalytics(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  }, []);

  const loadBilling = useCallback(async () => {
    try {
      const [rows, summary] = await Promise.all([
        api.adBilling.list(),
        api.adBilling.summary(),
      ]);
      setBillingRows(rows);
      setBillingSummary(summary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load billing');
    }
  }, []);

  const loadPackages = useCallback(async () => {
    try {
      const rows = await api.adBilling.packages();
      setPackages(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load packages');
    }
  }, []);

  const loadExport = useCallback(async () => {
    try {
      const rows = await api.businessAds.exportReport();
      setExportRows(rows as AdExportRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load report');
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadAnalytics(), loadBilling(), loadPackages()]);
    } finally {
      setLoading(false);
    }
  }, [loadAnalytics, loadBilling, loadPackages]);

  useEffect(() => { void refreshAll(); }, [refreshAll]);

  useEffect(() => {
    if (tab === 'export' && exportRows.length === 0) {
      void loadExport();
    }
  }, [tab, exportRows.length, loadExport]);

  const handlePayBilling = async (id: string) => {
    try {
      await api.adBilling.pay(id);
      toast.success('Marked as paid');
      await loadBilling();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    try {
      await api.adBilling.deletePackage(id);
      toast.success('Package deleted');
      await loadPackages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const rows = exportRows.length > 0 ? exportRows : await api.businessAds.exportReport() as AdExportRow[];
      const csv = jsonToCsv(rows);
      downloadCsv(csv, `ad-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Exported');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const chartConfig = analytics ? {
    type: 'bar' as const,
    data: {
      labels: analytics.monthlyImpressions.map((m) => m.month),
      datasets: [
        {
          label: 'Impressions',
          data: analytics.monthlyImpressions.map((m) => m.count),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.1)' } }, x: { grid: { display: false } } },
    },
  } : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Ad Billing & Analytics</h1>
          <p className="text-sm text-slate-500">Track impressions, manage billing, and export reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void refreshAll()} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          {tab === 'billing' && (
            <button onClick={() => setAddBillingOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add Billing
            </button>
          )}
          {tab === 'packages' && (
            <button onClick={() => setPkgForm({})} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add Package
            </button>
          )}
          {tab === 'export' && (
            <button onClick={() => void handleExportCsv()} disabled={exporting} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['analytics', 'billing', 'packages', 'export'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Analytics Tab ── */}
      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* KPI row 1: engagement */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard label="Total Ads" value={fmt(analytics.totalAds)} icon={BarChart2} color="bg-indigo-500" />
            <KpiCard label="Active Ads" value={fmt(analytics.activeAds)} icon={TrendingUp} color="bg-emerald-500" />
            <KpiCard label="Total Impressions" value={fmt(analytics.totalImpressions)} icon={Eye} color="bg-sky-500" />
            <KpiCard label="Total Clicks" value={fmt(analytics.totalClicks)} icon={MousePointerClick} color="bg-violet-500" />
            <KpiCard label="Avg CTR" value={`${analytics.avgCtr.toFixed(2)}%`} icon={TrendingUp} color="bg-amber-500" />
          </div>
          {/* KPI row 2: revenue */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard label="Total Revenue (Paid)" value={currency(analytics.revenueSummary.total_revenue)} icon={DollarSign} color="bg-emerald-600" />
            <KpiCard label="Pending Revenue" value={currency(analytics.revenueSummary.pending)} icon={DollarSign} color="bg-amber-500" />
            <KpiCard label="Overdue Invoices" value={fmt(analytics.revenueSummary.overdue_count)} icon={DollarSign} color="bg-rose-500" />
          </div>

          {/* Monthly Impressions Chart */}
          {chartConfig && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-200">Monthly Impressions (last 6 months)</h2>
              <MiniChart config={chartConfig} height={180} />
            </div>
          )}

          {/* Top tables */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top Clicked */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Top 5 Clicked Ads</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Ad</th>
                    <th className="px-4 py-2 text-right">Clicks</th>
                    <th className="px-4 py-2 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {analytics.topClicked.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">No data</td></tr>
                  ) : analytics.topClicked.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{r.title}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{fmt(r.clicks)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{r.ctr.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Viewed */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Top 5 Most Viewed Ads</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Ad</th>
                    <th className="px-4 py-2 text-right">Impressions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {analytics.topViewed.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">No data</td></tr>
                  ) : analytics.topViewed.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{r.title}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">{fmt(r.impressions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Billing Tab ── */}
      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Billing KPIs */}
          {billingSummary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KpiCard label="Total Revenue" value={currency(billingSummary.total_revenue)} icon={DollarSign} color="bg-emerald-600" />
              <KpiCard label="Pending" value={currency(billingSummary.pending)} icon={DollarSign} color="bg-amber-500" />
              <KpiCard label="Overdue" value={fmt(billingSummary.overdue_count)} icon={DollarSign} color="bg-rose-500" sub={currency(billingSummary.overdue_amount)} />
            </div>
          )}

          {/* Billing Table */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Package</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Due Date</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Paid At</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {billingRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No billing records yet.</td></tr>
                ) : billingRows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{b.businessName ?? `Ad #${b.adId}`}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-500 text-xs">{b.packageName ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{currency(b.amount)}</td>
                    <td className="px-4 py-3"><BillingStatusBadge status={b.billingStatus} /></td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{b.dueDate ?? '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{b.paidAt ?? '—'}</td>
                    <td className="px-4 py-3">
                      {(b.billingStatus === 'Pending' || b.billingStatus === 'Overdue') && (
                        <button onClick={() => void handlePayBilling(b.id)} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle className="h-3.5 w-3.5" /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Packages Tab ── */}
      {tab === 'packages' && (
        <div className="space-y-4">
          {packages.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Package className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-500">No packages yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                  <div className="bg-indigo-50 px-5 py-4 dark:bg-indigo-900/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-[Outfit] text-base font-bold text-slate-900 dark:text-slate-100">{pkg.name}</h3>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{currency(pkg.price)}</p>
                    <p className="text-xs text-slate-500">{pkg.durationDays} days{pkg.maxImpressions > 0 ? ` · ${fmt(pkg.maxImpressions)} imp.` : ' · unlimited'}</p>
                  </div>
                  <div className="p-5">
                    {pkg.description && <p className="mb-3 text-xs text-slate-500">{pkg.description}</p>}
                    <ul className="space-y-1.5">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setPkgForm(pkg)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700 dark:text-slate-300">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => void handleDeletePackage(pkg.id)} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Export Tab ── */}
      {tab === 'export' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Ad Performance Report</h2>
              <button onClick={() => void handleExportCsv()} disabled={exporting} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Download CSV'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="px-3 py-2">Business</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Impressions</th>
                    <th className="px-3 py-2 text-right">Clicks</th>
                    <th className="px-3 py-2 text-right">CTR</th>
                    <th className="px-3 py-2">Package</th>
                    <th className="px-3 py-2">Billing</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {exportRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-400">Loading…</td></tr>
                  ) : exportRows.slice(0, 20).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{r.business_name}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status} size="sm" /></td>
                      <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">{fmt(r.impressions)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">{fmt(r.clicks)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">{r.ctr.toFixed(2)}%</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.package_name ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {r.billing_status ? <BillingStatusBadge status={r.billing_status as AdBilling['billingStatus']} /> : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">{r.billing_amount > 0 ? currency(r.billing_amount) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {exportRows.length > 20 && (
                <p className="px-3 py-2 text-xs text-slate-400">Showing 20 of {exportRows.length} rows. Download CSV for full data.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {pkgForm !== null && (
        <PackageForm
          pkg={pkgForm}
          onClose={() => setPkgForm(null)}
          onSaved={() => void loadPackages()}
        />
      )}
      {addBillingOpen && (
        <AddBillingForm
          packages={packages}
          onClose={() => setAddBillingOpen(false)}
          onSaved={() => void loadBilling()}
        />
      )}
    </div>
  );
}
