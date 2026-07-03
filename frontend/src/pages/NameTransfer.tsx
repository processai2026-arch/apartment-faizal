import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, Plus, RefreshCcw, Clock, BadgeCheck, CheckCircle2, XCircle, Trash2, Eye, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { api } from '@/lib/api';
import { useNameTransferStore } from '@/stores/useNameTransferStore';
import type { NameTransfer, NameTransferStatus, Office } from '@/types';

const STATUSES: NameTransferStatus[] = ['Pending', 'Approved', 'Rejected', 'Completed'];
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

interface TransferForm {
  officeId?: string;
  fromName?: string;
  toName?: string;
  toContactPerson?: string;
  toPhone?: string;
  toEmail?: string;
  reason?: string;
  effectiveDate?: string;
  supportingDocAttachmentId?: string;
  notes?: string;
}

export default function NameTransferPage() {
  const { transfers, summary, loading, loadTransfers, loadSummary, createTransfer, approveTransfer, rejectTransfer, completeTransfer, deleteTransfer } = useNameTransferStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [offices, setOffices] = useState<Office[]>([]);
  const [form, setForm] = useState<TransferForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<NameTransfer | null>(null);

  useEffect(() => {
    api.offices.list().then(setOffices).catch(() => undefined);
  }, []);

  const refresh = useCallback(() => {
    Promise.all([
      loadTransfers({ status: statusFilter || undefined, office_id: officeFilter || undefined }),
      loadSummary(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load transfers'));
  }, [statusFilter, officeFilter, loadTransfers, loadSummary]);

  useEffect(() => { refresh(); }, [refresh]);

  const officeName = (t: NameTransfer) => t.office?.companyName ?? (offices.find((o) => o.id === t.officeId)?.companyName ?? `#${t.officeId}`);
  const officeUnit = (t: NameTransfer) => (t.office ? `${t.office.block}-${t.office.floorNumber}` : (() => { const o = offices.find((x) => x.id === t.officeId); return o ? `${o.block}-${o.floorNumber}` : ''; })());

  const pickOffice = (id: string) => {
    const o = offices.find((x) => x.id === id);
    setForm((f) => f && { ...f, officeId: id || undefined, fromName: o?.companyName });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.create(file, 'name-transfers');
      setForm((f) => f && { ...f, supportingDocAttachmentId: String(uploaded.id) });
      toast.success('Supporting document uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.officeId || !form.toName) { toast.error('Select an office and enter the incoming tenant name'); return; }
    setSaving(true);
    try {
      const created = await createTransfer(form);
      toast.success(`Transfer requested — ${created.transferNo}`);
      setForm(null);
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to create transfer'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (t: NameTransfer) => {
    try { await approveTransfer(t.id); toast.success(`${t.transferNo} approved`); loadSummary().catch(() => undefined); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to approve'); }
  };

  const handleReject = async (t: NameTransfer) => {
    const notes = prompt(`Reason for rejecting ${t.transferNo}? (optional)`) ?? undefined;
    try { await rejectTransfer(t.id, notes); toast.success(`${t.transferNo} rejected`); loadSummary().catch(() => undefined); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to reject'); }
  };

  const handleComplete = async (t: NameTransfer) => {
    if (!confirm(`Complete ${t.transferNo}?\n\nThis will UPDATE office "${officeName(t)}" — the occupant name will change from "${t.fromName ?? '—'}" to "${t.toName}". This cannot be undone.`)) return;
    try { await completeTransfer(t.id); toast.success(`${t.transferNo} completed — office updated`); loadSummary().catch(() => undefined); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to complete'); }
  };

  const handleDelete = async (t: NameTransfer) => {
    if (!confirm(`Delete transfer ${t.transferNo}?`)) return;
    try { await deleteTransfer(t.id); toast.success('Transfer deleted'); loadSummary().catch(() => undefined); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const columns: Column<NameTransfer>[] = [
    {
      key: 'transferNo', label: 'Transfer',
      render: (t) => (
        <div>
          <p className="font-medium text-slate-900">{t.transferNo}</p>
          <p className="text-xs text-slate-400">{officeName(t)} · {officeUnit(t)}</p>
        </div>
      ),
    },
    {
      key: 'fromName', label: 'From → To',
      render: (t) => (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-500 line-through">{t.fromName ?? '—'}</span>
          <ArrowLeftRight className="h-3 w-3 text-slate-400" />
          <span className="font-medium text-slate-800">{t.toName}</span>
        </div>
      ),
    },
    { key: 'toContactPerson', label: 'New Contact', render: (t) => <span className="text-slate-600">{t.toContactPerson ?? '—'}{t.toPhone ? ` · ${t.toPhone}` : ''}</span> },
    { key: 'effectiveDate', label: 'Effective', render: (t) => <span className="text-slate-600">{fmtDate(t.effectiveDate)}</span> },
    { key: 'status', label: 'Status', render: (t) => <StatusBadge status={t.status} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Name Transfer</h1>
          <p className="text-sm text-slate-500">Handle incoming tenants &amp; occupant name changes for office units</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setForm({ effectiveDate: new Date().toISOString().slice(0, 10) })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Transfer
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Pending" value={summary?.pending ?? 0} icon={Clock} color="amber" />
        <StatCard label="Approved" value={summary?.approved ?? 0} icon={BadgeCheck} color="blue" />
        <StatCard label="Completed (This Month)" value={summary?.completedThisMonth ?? 0} icon={CheckCircle2} color="green" />
      </div>

      <DataTable
        data={transfers}
        columns={columns}
        searchKeys={['transferNo', 'fromName', 'toName', 'toContactPerson', 'toPhone']}
        searchPlaceholder="Search by office or name…"
        toolbar={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Office / Unit</label>
              <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Offices</option>
                {offices.map((o) => <option key={o.id} value={o.id}>{o.companyName} · {o.block}-{o.floorNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            {(statusFilter || officeFilter) && (
              <button onClick={() => { setStatusFilter(''); setOfficeFilter(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700">
                Clear filters
              </button>
            )}
          </div>
        }
        empty={<EmptyState icon={ArrowLeftRight} title="No name transfers" description="Create a transfer to onboard an incoming tenant." />}
        actions={(t) => (
          <>
            <button title="View" onClick={() => setViewing(t)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"><Eye className="h-3.5 w-3.5" /></button>
            {t.status === 'Pending' && (
              <button title="Approve" onClick={() => handleApprove(t)} className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"><BadgeCheck className="h-3.5 w-3.5" /></button>
            )}
            {(t.status === 'Pending' || t.status === 'Approved') && (
              <button title="Reject" onClick={() => handleReject(t)} className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"><XCircle className="h-3.5 w-3.5" /></button>
            )}
            {(t.status === 'Pending' || t.status === 'Approved') && (
              <button title="Complete (updates office)" onClick={() => handleComplete(t)} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /></button>
            )}
            <button title="Delete" onClick={() => handleDelete(t)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </>
        )}
      />

      {/* New transfer dialog */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">New Name Transfer</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Office / Unit *</label>
                <select required value={form.officeId ?? ''} onChange={(e) => pickOffice(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select an office…</option>
                  {offices.map((o) => <option key={o.id} value={o.id}>{o.companyName} · {o.block}-{o.floorNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Occupant (from)</label>
                <input value={form.fromName ?? ''} readOnly placeholder="Auto-filled from selected office" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Incoming Tenant Name *</label>
                  <input required value={form.toName ?? ''} onChange={(e) => setForm((f) => f && { ...f, toName: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Person</label>
                  <input value={form.toContactPerson ?? ''} onChange={(e) => setForm((f) => f && { ...f, toContactPerson: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input value={form.toPhone ?? ''} onChange={(e) => setForm((f) => f && { ...f, toPhone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <input type="email" value={form.toEmail ?? ''} onChange={(e) => setForm((f) => f && { ...f, toEmail: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Effective Date</label>
                  <input type="date" value={form.effectiveDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, effectiveDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
                  <input value={form.reason ?? ''} onChange={(e) => setForm((f) => f && { ...f, reason: e.target.value })} placeholder="Lease change, new owner…" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Supporting Document</label>
                <div className="flex items-center gap-2">
                  <label className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors', form.supportingDocAttachmentId ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600')}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? 'Uploading…' : form.supportingDocAttachmentId ? `Attached (#${form.supportingDocAttachmentId})` : 'Upload agreement / ID (image / PDF)'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  {form.supportingDocAttachmentId && (
                    <button type="button" title="Remove" onClick={() => setForm((f) => f && { ...f, supportingDocAttachmentId: undefined })} className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><X className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm((f) => f && { ...f, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Request Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View dialog */}
      {viewing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{viewing.transferNo}</h3>
              <StatusBadge status={viewing.status} size="sm" />
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Office</dt><dd className="text-right font-medium text-slate-800 dark:text-slate-200">{officeName(viewing)} · {officeUnit(viewing)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">From</dt><dd className="text-right text-slate-700 dark:text-slate-300">{viewing.fromName ?? '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">To</dt><dd className="text-right font-medium text-slate-800 dark:text-slate-200">{viewing.toName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Contact</dt><dd className="text-right text-slate-700 dark:text-slate-300">{viewing.toContactPerson ?? '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Phone</dt><dd className="text-right text-slate-700 dark:text-slate-300">{viewing.toPhone ?? '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd className="text-right text-slate-700 dark:text-slate-300">{viewing.toEmail ?? '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Effective</dt><dd className="text-right text-slate-700 dark:text-slate-300">{fmtDate(viewing.effectiveDate)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Reason</dt><dd className="text-right text-slate-700 dark:text-slate-300">{viewing.reason ?? '—'}</dd></div>
              {viewing.notes && <div className="flex justify-between gap-4"><dt className="text-slate-500">Notes</dt><dd className="text-right text-slate-700 dark:text-slate-300">{viewing.notes}</dd></div>}
            </dl>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setViewing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
