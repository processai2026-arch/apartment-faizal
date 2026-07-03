import { useState, useEffect, useCallback } from 'react';
import { Package, PackageCheck, Plus, RefreshCcw, Wrench, ShieldCheck, Pencil, Trash2, LogOut, LogIn, ClipboardCheck, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { api } from '@/lib/api';
import { useAssetStore } from '@/stores/useAssetStore';
import type { Asset, AssetCategory, AssetCondition, Staff } from '@/types';

const CATEGORIES: AssetCategory[] = ['Safety Gear', 'Cleaning Equipment', 'Tools', 'Utility Gear', 'Other'];
const CONDITIONS: AssetCondition[] = ['New', 'Good', 'Fair', 'Damaged', 'Retired'];
const STATUSES = ['Available', 'Checked Out', 'Under Maintenance', 'Retired'];

type Tab = 'Assets' | 'Checked Out' | 'Audit Log';
const TABS: Tab[] = ['Assets', 'Checked Out', 'Audit Log'];

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

// ── Attachment upload field ──────────────────────────────────────────────────
function UploadField({ label, value, onChange }: { label: string; value?: string; onChange: (id?: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.create(file, 'assets');
      onChange(String(uploaded.id));
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <label className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors', value ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600')}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : value ? `Attached (#${value})` : 'Upload photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" title="Remove attachment" onClick={() => onChange(undefined)} className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AssetTracking() {
  const {
    assets, summary, openAssignments, audits, loading,
    loadAssets, loadSummary, loadOpenAssignments, loadAudits,
    createAsset, updateAsset, deleteAsset, checkout, checkin, audit,
  } = useAssetStore();

  const [tab, setTab] = useState<Tab>('Assets');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [form, setForm] = useState<Partial<Asset> | null>(null);
  const [saving, setSaving] = useState(false);

  const [checkoutFor, setCheckoutFor] = useState<Asset | null>(null);
  const [checkoutStaffId, setCheckoutStaffId] = useState('');
  const [checkoutDue, setCheckoutDue] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  const [checkinFor, setCheckinFor] = useState<Asset | null>(null);
  const [checkinCondition, setCheckinCondition] = useState<AssetCondition>('Good');
  const [checkinNotes, setCheckinNotes] = useState('');

  const [auditFor, setAuditFor] = useState<Asset | null>(null);
  const [auditFound, setAuditFound] = useState('Available');
  const [auditCondition, setAuditCondition] = useState<AssetCondition>('Good');
  const [auditRemarks, setAuditRemarks] = useState('');

  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      loadAssets({ category: category || undefined, status: status || undefined }),
      loadSummary(),
      loadOpenAssignments(),
      loadAudits(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load assets'));
  }, [category, status, loadAssets, loadSummary, loadOpenAssignments, loadAudits]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.staff.list().then(setStaffList).catch(() => undefined); }, []);

  const staffName = (id: string) => staffList.find((s) => s.id === id)?.name ?? `#${id}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) { await updateAsset(form.id, form); toast.success('Asset updated'); }
      else { const created = await createAsset(form); toast.success(`Asset registered — ${created.assetTag}`); }
      setForm(null);
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save asset'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Delete asset ${asset.assetTag}?`)) return;
    try {
      await deleteAsset(asset.id);
      toast.success('Asset removed');
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const openCheckout = (asset: Asset) => {
    setCheckoutFor(asset);
    setCheckoutStaffId(staffList[0]?.id ?? '');
    setCheckoutDue('');
    setCheckoutNotes('');
  };

  const submitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutFor || !checkoutStaffId) { toast.error('Select a staff member'); return; }
    setBusy(true);
    try {
      await checkout(checkoutFor.id, { staffId: checkoutStaffId, dueAt: checkoutDue || undefined, notes: checkoutNotes || undefined });
      toast.success(`${checkoutFor.assetTag} checked out to ${staffName(checkoutStaffId)}`);
      setCheckoutFor(null);
      loadSummary().catch(() => undefined);
      loadOpenAssignments().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Checkout failed'); }
    finally { setBusy(false); }
  };

  const openCheckin = (asset: Asset) => {
    setCheckinFor(asset);
    setCheckinCondition('Good');
    setCheckinNotes('');
  };

  const submitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinFor) return;
    setBusy(true);
    try {
      await checkin(checkinFor.id, { returnCondition: checkinCondition, notes: checkinNotes || undefined });
      toast.success(`${checkinFor.assetTag} checked in`);
      setCheckinFor(null);
      loadSummary().catch(() => undefined);
      loadOpenAssignments().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Check-in failed'); }
    finally { setBusy(false); }
  };

  // Quick check-in from the "Checked Out" tab (defaults to Good condition).
  const quickCheckin = async (assetId: string, assetTag?: string) => {
    setBusy(true);
    try {
      await checkin(assetId, { returnCondition: 'Good' });
      toast.success(`${assetTag ?? 'Asset'} checked in`);
      loadSummary().catch(() => undefined);
      loadOpenAssignments().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Check-in failed'); }
    finally { setBusy(false); }
  };

  const openAudit = (asset: Asset) => {
    setAuditFor(asset);
    setAuditFound(asset.status);
    setAuditCondition(asset.condition);
    setAuditRemarks('');
  };

  const submitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditFor) return;
    setBusy(true);
    try {
      await audit(auditFor.id, { foundStatus: auditFound, condition: auditCondition, remarks: auditRemarks || undefined });
      toast.success(`Audit recorded for ${auditFor.assetTag}`);
      setAuditFor(null);
      loadAudits().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Audit failed'); }
    finally { setBusy(false); }
  };

  const assetColumns: Column<Asset>[] = [
    {
      key: 'assetTag', label: 'Asset',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.assetTag}</p>
          <p className="text-xs text-slate-400">{a.name}{a.assetType ? ` • ${a.assetType}` : ''}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (a) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{a.category}</span> },
    { key: 'serialNo', label: 'Serial', render: (a) => <span className="text-slate-700">{a.serialNo ?? '—'}</span> },
    { key: 'condition', label: 'Condition', render: (a) => <span className="text-slate-700">{a.condition}</span> },
    { key: 'status', label: 'Status', render: (a) => <StatusBadge status={a.status} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Asset Tracking</h1>
          <p className="text-sm text-slate-500">Safety gear, cleaning &amp; utility equipment — checkout by employee &amp; audits</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setForm({ category: 'Safety Gear', condition: 'New', status: 'Available' })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Assets" value={summary?.total ?? 0} icon={Package} color="indigo" />
        <StatCard label="Available" value={summary?.available ?? 0} icon={PackageCheck} color="green" />
        <StatCard label="Checked Out" value={summary?.checkedOut ?? 0} icon={LogOut} color="amber" />
        <StatCard label="Under Maintenance" value={summary?.underMaintenance ?? 0} icon={Wrench} color="blue" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Assets' && (
        <DataTable
          data={assets}
          columns={assetColumns}
          searchKeys={['assetTag', 'name', 'assetType', 'serialNo']}
          searchPlaceholder="Search assets…"
          toolbar={
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {(category || status) && (
                <button onClick={() => { setCategory(''); setStatus(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700">
                  Clear filters
                </button>
              )}
            </div>
          }
          empty={<EmptyState icon={Package} title="No assets found" description="Register your first tracked asset." />}
          actions={(a) => (
            <>
              {a.status === 'Available' && (
                <button title="Checkout" onClick={() => openCheckout(a)} className="rounded-lg bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"><LogOut className="h-3.5 w-3.5" /></button>
              )}
              {a.status === 'Checked Out' && (
                <button title="Check in" onClick={() => openCheckin(a)} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><LogIn className="h-3.5 w-3.5" /></button>
              )}
              <button title="Audit" onClick={() => openAudit(a)} className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"><ClipboardCheck className="h-3.5 w-3.5" /></button>
              <button title="Edit" onClick={() => setForm(a)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
              <button title="Delete" onClick={() => handleDelete(a)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        />
      )}

      {tab === 'Checked Out' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {openAssignments.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Nothing checked out" description="All assets are currently in stock." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Issued</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Due</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {openAssignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-indigo-50/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{asg.assetTag ?? `#${asg.assetId}`}</p>
                      <p className="text-xs text-slate-400">{asg.assetName}{asg.assetCategory ? ` • ${asg.assetCategory}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{asg.staffName ?? staffName(asg.staffId)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDateTime(asg.issuedAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(asg.dueAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button disabled={busy} onClick={() => quickCheckin(asg.assetId, asg.assetTag)} className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                          <LogIn className="h-3.5 w-3.5" /> Check in
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Audit Log' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {audits.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No audits yet" description="Record a physical verification from the Assets tab." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Found Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Condition</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {audits.map((au) => (
                  <tr key={au.id} className="hover:bg-indigo-50/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{au.assetTag ?? `#${au.assetId}`}</p>
                      <p className="text-xs text-slate-400">{au.assetName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(au.auditDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={au.foundStatus} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{au.condition}</td>
                    <td className="px-4 py-3 text-slate-500">{au.remarks ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add / Edit dialog */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">
              {form.id ? `Edit Asset ${form.assetTag ?? ''}` : 'Add Asset'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                <input required value={form.name ?? ''} onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })} placeholder="e.g. Safety Harness Set" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                  <select required value={form.category ?? 'Safety Gear'} onChange={(e) => setForm((f) => f && { ...f, category: e.target.value as AssetCategory })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                  <input value={form.assetType ?? ''} onChange={(e) => setForm((f) => f && { ...f, assetType: e.target.value })} placeholder="e.g. Seat Belt, Shoes, Gloves" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Serial No</label>
                  <input value={form.serialNo ?? ''} onChange={(e) => setForm((f) => f && { ...f, serialNo: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Condition</label>
                  <select value={form.condition ?? 'New'} onChange={(e) => setForm((f) => f && { ...f, condition: e.target.value as AssetCondition })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {form.id && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={form.status ?? 'Available'} onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as Asset['status'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Purchase Date</label>
                <input type="date" value={form.purchaseDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, purchaseDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <UploadField label="Photo" value={form.photoAttachmentId} onChange={(id) => setForm((f) => f && { ...f, photoAttachmentId: id })} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm((f) => f && { ...f, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : form.id ? 'Update Asset' : 'Save Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout dialog */}
      {checkoutFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-1 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Check out {checkoutFor.assetTag}</h3>
            <p className="mb-4 text-sm text-slate-500">{checkoutFor.name}</p>
            <form onSubmit={submitCheckout} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Employee *</label>
                <select required value={checkoutStaffId} onChange={(e) => setCheckoutStaffId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select staff member…</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                <input type="date" value={checkoutDue} onChange={(e) => setCheckoutDue(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <input value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCheckoutFor(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={busy} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">{busy ? 'Issuing…' : 'Check out'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in dialog */}
      {checkinFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-1 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Check in {checkinFor.assetTag}</h3>
            <p className="mb-4 text-sm text-slate-500">{checkinFor.name}</p>
            <form onSubmit={submitCheckin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Return Condition</label>
                <select value={checkinCondition} onChange={(e) => setCheckinCondition(e.target.value as AssetCondition)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-400">Damaged → Under Maintenance, Retired → Retired, else Available.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <input value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCheckinFor(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Returning…' : 'Check in'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit dialog */}
      {auditFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-1 flex items-center gap-2 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100"><ShieldCheck className="h-5 w-5 text-blue-600" /> Audit {auditFor.assetTag}</h3>
            <p className="mb-4 text-sm text-slate-500">{auditFor.name}</p>
            <form onSubmit={submitAudit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Found Status *</label>
                  <select value={auditFound} onChange={(e) => setAuditFound(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Condition *</label>
                  <select value={auditCondition} onChange={(e) => setAuditCondition(e.target.value as AssetCondition)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
                <textarea rows={2} value={auditRemarks} onChange={(e) => setAuditRemarks(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAuditFor(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Saving…' : 'Record Audit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
