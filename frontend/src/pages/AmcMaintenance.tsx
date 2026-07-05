import { useState, useEffect, useCallback } from 'react';
import { FileCog, Fuel, Plus, RefreshCcw, Pencil, Trash2, CalendarClock, Upload, X, Timer, Wrench, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { api } from '@/lib/api';
import { useAmcStore } from '@/stores/useAmcStore';
import type { AmcContract, AmcContractType, AmcPaymentFrequency, AmcStatus, DgMaintenanceLog, Vendor } from '@/types';

const CONTRACT_TYPES: AmcContractType[] = ['AMC', 'DG Maintenance', 'Lift AMC', 'Fire Safety', 'Other'];
const FREQUENCIES: AmcPaymentFrequency[] = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time'];
const AMC_STATUSES: AmcStatus[] = ['Active', 'Expired', 'Cancelled'];
const EB_APPROVAL_STATUSES = ['Not Required', 'Pending', 'Approved', 'Expired'] as const;
type EbApprovalStatus = typeof EB_APPROVAL_STATUSES[number];

type Tab = 'AMC Contracts' | 'DG Logs';
const TABS: Tab[] = ['AMC Contracts', 'DG Logs'];

/** Extended form state — adds EB approval & genset fields not yet in the core type. */
type ContractFormState = Partial<AmcContract> & {
  ebApprovalRequired?: boolean;
  ebApprovalStatus?: EbApprovalStatus;
  ebApprovalDate?: string;
  regulationReference?: string;
};

const inr = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Days from today until the given date (negative = past). */
const daysUntil = (d?: string) => {
  if (!d) return Infinity;
  return Math.ceil((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
};

/** Open WhatsApp with a pre-filled expiry reminder message. */
const sendWhatsAppReminder = (c: AmcContract) => {
  const name = c.title ?? c.contractNo;
  const msg = `Reminder: AMC contract for ${name} expires on ${fmtDate(c.endDate)}. Please renew.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

function ExpiryBadge({ contract }: { contract: AmcContract }) {
  if (contract.status !== 'Active' || !contract.endDate) return null;
  const days = daysUntil(contract.endDate);
  if (days < 0) {
    return <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Expired {Math.abs(days)}d ago</span>;
  }
  if (days <= contract.reminderDays) {
    return <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{days === 0 ? 'Expires today' : `Expires in ${days}d`}</span>;
  }
  return null;
}

// ── Attachment upload field (POST /uploads, module: amc) ────────────────────
function UploadField({ label, value, onChange }: { label: string; value?: string; onChange: (id?: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.create(file, 'amc');
      onChange(String(uploaded.id));
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <label className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors', value ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600')}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : value ? `Attached (#${value})` : 'Upload document'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" title="Remove attachment" onClick={() => onChange(undefined)} className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AmcMaintenance() {
  const {
    contracts, expiring, dgLogs, dgSummary, loading,
    loadContracts, loadExpiring, loadDgLogs, loadDgSummary,
    createContract, updateContract, deleteContract,
    createDgLog, updateDgLog, deleteDgLog,
  } = useAmcStore();

  const [tab, setTab] = useState<Tab>('AMC Contracts');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [contractForm, setContractForm] = useState<ContractFormState | null>(null);
  const [logForm, setLogForm] = useState<Partial<DgMaintenanceLog> | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      loadContracts({ contract_type: typeFilter || undefined, status: statusFilter || undefined }),
      loadExpiring(),
      loadDgLogs(),
      loadDgSummary(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load AMC data'));
  }, [typeFilter, statusFilter, loadContracts, loadExpiring, loadDgLogs, loadDgSummary]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.vendors.list().then(setVendors).catch(() => undefined); }, []);

  const activeCount = contracts.filter((c) => c.status === 'Active').length;

  // ── Contract handlers ──────────────────────────────────────────────────
  const saveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm) return;
    setSaving(true);
    try {
      if (contractForm.id) {
        await updateContract(contractForm.id, contractForm as Partial<AmcContract>);
        toast.success('Contract updated');
      } else {
        const created = await createContract(contractForm as Partial<AmcContract>);
        toast.success(`Contract created — ${created.contractNo}`);
      }
      setContractForm(null);
      loadExpiring().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save contract'); }
    finally { setSaving(false); }
  };

  const handleDeleteContract = async (c: AmcContract) => {
    if (!confirm(`Delete contract ${c.contractNo}?`)) return;
    try {
      await deleteContract(c.id);
      toast.success('Contract removed');
      loadExpiring().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  /** Renew = open the edit dialog focused on fresh dates (status back to Active). */
  const openRenew = (c: AmcContract) => {
    setContractForm({ ...c, status: 'Active' });
    toast.info('Update the start/end dates to renew this contract');
  };

  // ── DG log handlers ────────────────────────────────────────────────────
  const saveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm) return;
    setSaving(true);
    try {
      if (logForm.id) {
        await updateDgLog(logForm.id, logForm);
        toast.success('DG log updated');
      } else {
        await createDgLog(logForm);
        toast.success('DG log recorded');
      }
      setLogForm(null);
      loadDgSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save DG log'); }
    finally { setSaving(false); }
  };

  const handleDeleteLog = async (log: DgMaintenanceLog) => {
    if (!confirm(`Delete DG log for ${fmtDate(log.logDate)}?`)) return;
    try {
      await deleteDgLog(log.id);
      toast.success('DG log removed');
      loadDgSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  // ── Columns ────────────────────────────────────────────────────────────
  const contractColumns: Column<AmcContract>[] = [
    {
      key: 'contractNo', label: 'Contract',
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">{c.contractNo}<ExpiryBadge contract={c} /></p>
          <p className="text-xs text-slate-400">{c.title}</p>
        </div>
      ),
    },
    { key: 'contractType', label: 'Type', render: (c) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{c.contractType}</span> },
    { key: 'vendorName', label: 'Vendor', render: (c) => <span className="text-slate-700">{c.vendorName ?? '—'}</span> },
    { key: 'endDate', label: 'Period', render: (c) => <span className="text-slate-500">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</span> },
    { key: 'amount', label: 'Amount', render: (c) => <span className="font-medium text-indigo-600">{inr(c.amount)}<span className="block text-xs font-normal text-slate-400">{c.paymentFrequency}</span></span> },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status === 'Expired' ? 'Overdue' : c.status === 'Cancelled' ? 'Inactive' : 'Active'} size="sm" /> },
  ];

  const logColumns: Column<DgMaintenanceLog>[] = [
    { key: 'logDate', label: 'Date', render: (l) => <span className="font-medium text-slate-900">{fmtDate(l.logDate)}</span> },
    { key: 'dgName', label: 'Generator', render: (l) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{l.dgName}</span> },
    { key: 'runHours', label: 'Run Hours', render: (l) => <span className="text-slate-700">{l.runHours} h</span> },
    { key: 'dieselAddedLitres', label: 'Diesel', render: (l) => <span className="text-slate-700">{l.dieselAddedLitres} L<span className="block text-xs text-slate-400">{inr(l.dieselCost)}</span></span> },
    { key: 'servicePerformed', label: 'Service', render: (l) => <span className="text-slate-500">{l.servicePerformed ?? '—'}</span>, className: 'max-w-[220px] truncate' },
    { key: 'nextServiceDate', label: 'Next Service', render: (l) => <span className={cn('text-slate-500', l.nextServiceDate && daysUntil(l.nextServiceDate) <= 7 && 'font-medium text-amber-600')}>{fmtDate(l.nextServiceDate)}</span> },
    { key: 'performedBy', label: 'By', render: (l) => <span className="text-slate-500">{l.performedBy ?? '—'}</span> },
  ];

  /** True when a contract is expiring within its reminder window or already expired. */
  const isExpiringSoon = (c: AmcContract) =>
    c.status === 'Active' && !!c.endDate && daysUntil(c.endDate) <= c.reminderDays;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900">AMC &amp; DG Maintenance</h1>
          <p className="text-sm text-slate-500">Maintenance contracts with renewal reminders and diesel-generator logs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          {tab === 'AMC Contracts' ? (
            <button
              onClick={() => setContractForm({ contractType: 'AMC', paymentFrequency: 'Yearly', reminderDays: 30, status: 'Active', startDate: todayStr(), ebApprovalRequired: false, ebApprovalStatus: 'Not Required' })}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add AMC Contract
            </button>
          ) : (
            <button onClick={() => setLogForm({ dgName: 'DG-1', logDate: todayStr() })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add DG Log
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active AMCs" value={activeCount} icon={FileCog} color="indigo" />
        <StatCard label="Expiring Soon" value={expiring.length} icon={CalendarClock} color={expiring.length > 0 ? 'amber' : 'green'} subtitle="within reminder window" />
        <StatCard label="DG Hours (month)" value={`${dgSummary?.monthRunHours ?? 0} h`} icon={Timer} color="blue" subtitle={`${dgSummary?.monthLogs ?? 0} log entries`} />
        <StatCard label="Diesel Cost (month)" value={inr(dgSummary?.monthDieselCost ?? 0)} icon={Fuel} color="amber" subtitle={`${dgSummary?.monthDieselLitres ?? 0} litres added`} />
      </div>

      {dgSummary?.nextServiceDate && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Wrench className="h-4 w-4 flex-shrink-0" />
          Next DG service due <strong>{fmtDate(dgSummary.nextServiceDate)}</strong>{dgSummary.nextServiceDg ? <> for <strong>{dgSummary.nextServiceDg}</strong></> : null}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'AMC Contracts' && (
        <DataTable
          data={contracts}
          columns={contractColumns}
          searchKeys={['contractNo', 'title', 'vendorName', 'contractType']}
          searchPlaceholder="Search contracts…"
          toolbar={
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">All Types</option>
                  {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">All Statuses</option>
                  {AMC_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {(typeFilter || statusFilter) && (
                <button onClick={() => { setTypeFilter(''); setStatusFilter(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
                  Clear filters
                </button>
              )}
            </div>
          }
          empty={<EmptyState icon={FileCog} title="No AMC contracts" description="Add your first maintenance contract to start tracking renewals." />}
          actions={(c) => (
            <>
              {isExpiringSoon(c) && (
                <button
                  title="Send WhatsApp expiry reminder"
                  onClick={() => sendWhatsAppReminder(c)}
                  className="rounded-lg bg-green-50 p-1.5 text-green-700 hover:bg-green-100"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              )}
              {c.status === 'Active' && c.endDate && daysUntil(c.endDate) <= c.reminderDays && (
                <button title="Renew (edit dates)" onClick={() => openRenew(c)} className="rounded-lg bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"><CalendarClock className="h-3.5 w-3.5" /></button>
              )}
              <button title="Edit" onClick={() => setContractForm(c as ContractFormState)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
              <button title="Delete" onClick={() => handleDeleteContract(c)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        />
      )}

      {tab === 'DG Logs' && (
        <DataTable
          data={dgLogs}
          columns={logColumns}
          searchKeys={['dgName', 'servicePerformed', 'performedBy']}
          searchPlaceholder="Search DG logs…"
          empty={<EmptyState icon={Fuel} title="No DG logs yet" description="Record generator run hours, diesel refills and services." />}
          actions={(l) => (
            <>
              <button title="Edit" onClick={() => setLogForm(l)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
              <button title="Delete" onClick={() => handleDeleteLog(l)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        />
      )}

      {/* Contract add/edit dialog */}
      {contractForm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900">
              {contractForm.id ? `Edit Contract ${contractForm.contractNo ?? ''}` : 'Add AMC Contract'}
            </h3>
            <form onSubmit={saveContract} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
                <input required value={contractForm.title ?? ''} onChange={(e) => setContractForm((f) => f && { ...f, title: e.target.value })} placeholder="e.g. Lift AMC — Tower A" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Type *</label>
                  <select required value={contractForm.contractType ?? 'AMC'} onChange={(e) => setContractForm((f) => f && { ...f, contractType: e.target.value as AmcContractType })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Vendor</label>
                  <select value={contractForm.vendorId ?? ''} onChange={(e) => {
                    const vendor = vendors.find((v) => v.id === e.target.value);
                    setContractForm((f) => f && { ...f, vendorId: e.target.value || undefined, vendorName: vendor ? vendor.name : f.vendorName });
                  }} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="">No linked vendor</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.company}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Vendor name (as on contract)</label>
                <input value={contractForm.vendorName ?? ''} onChange={(e) => setContractForm((f) => f && { ...f, vendorName: e.target.value })} placeholder="e.g. Kone Elevators India" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>

              {/* Genset-specific note */}
              {contractForm.contractType === 'DG Maintenance' && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <Fuel className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="font-medium">Genset AMC typically required every 3 years per regulation</p>
                    <p className="text-xs text-blue-600 mt-0.5">Ensure contract end date aligns with the 3-year renewal cycle.</p>
                  </div>
                </div>
              )}

              {/* Regulation Reference — only for DG Maintenance */}
              {contractForm.contractType === 'DG Maintenance' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Regulation Reference <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    value={contractForm.regulationReference ?? ''}
                    onChange={(e) => setContractForm((f) => f && { ...f, regulationReference: e.target.value })}
                    placeholder="e.g. CPCB/TNPCB rule no. or IS 10000 reference"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Start Date *</label>
                  <input required type="date" value={contractForm.startDate ?? ''} onChange={(e) => setContractForm((f) => f && { ...f, startDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">End Date *</label>
                  <input required type="date" value={contractForm.endDate ?? ''} onChange={(e) => setContractForm((f) => f && { ...f, endDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount (₹)</label>
                  <input type="number" min={0} step="0.01" value={contractForm.amount ?? ''} onChange={(e) => setContractForm((f) => f && { ...f, amount: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Frequency</label>
                  <select value={contractForm.paymentFrequency ?? 'Yearly'} onChange={(e) => setContractForm((f) => f && { ...f, paymentFrequency: e.target.value as AmcPaymentFrequency })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {FREQUENCIES.map((fq) => <option key={fq}>{fq}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Remind (days)</label>
                  <input type="number" min={0} value={contractForm.reminderDays ?? 30} onChange={(e) => setContractForm((f) => f && { ...f, reminderDays: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>

              {/* EB Approval section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Electrical Board (EB) Approval</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!contractForm.ebApprovalRequired}
                    onChange={(e) => setContractForm((f) => f && {
                      ...f,
                      ebApprovalRequired: e.target.checked,
                      ebApprovalStatus: e.target.checked ? (f.ebApprovalStatus ?? 'Pending') : 'Not Required',
                    })}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700">EB Approval Required</span>
                </label>
                {contractForm.ebApprovalRequired && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">EB Approval Status</label>
                      <select
                        value={contractForm.ebApprovalStatus ?? 'Pending'}
                        onChange={(e) => setContractForm((f) => f && { ...f, ebApprovalStatus: e.target.value as EbApprovalStatus })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      >
                        {EB_APPROVAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">EB Approval Date</label>
                      <input
                        type="date"
                        value={contractForm.ebApprovalDate ?? ''}
                        onChange={(e) => setContractForm((f) => f && { ...f, ebApprovalDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {contractForm.id && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select value={contractForm.status ?? 'Active'} onChange={(e) => setContractForm((f) => f && { ...f, status: e.target.value as AmcStatus })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    {AMC_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <UploadField label="Contract document" value={contractForm.documentAttachmentId} onChange={(id) => setContractForm((f) => f && { ...f, documentAttachmentId: id })} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
                <textarea rows={2} value={contractForm.notes ?? ''} onChange={(e) => setContractForm((f) => f && { ...f, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setContractForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : contractForm.id ? 'Update Contract' : 'Save Contract'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DG log add/edit dialog */}
      {logForm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900">
              {logForm.id ? 'Edit DG Log' : 'Add DG Log'}
            </h3>
            <form onSubmit={saveLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Date *</label>
                  <input required type="date" value={logForm.logDate ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, logDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Generator</label>
                  <input value={logForm.dgName ?? 'DG-1'} onChange={(e) => setLogForm((f) => f && { ...f, dgName: e.target.value })} placeholder="DG-1" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Run hours</label>
                  <input type="number" min={0} step="0.1" value={logForm.runHours ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, runHours: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Diesel (L)</label>
                  <input type="number" min={0} step="0.1" value={logForm.dieselAddedLitres ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, dieselAddedLitres: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Diesel cost (₹)</label>
                  <input type="number" min={0} step="0.01" value={logForm.dieselCost ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, dieselCost: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Service performed</label>
                <input value={logForm.servicePerformed ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, servicePerformed: e.target.value })} placeholder="e.g. Oil + filter change, coolant top-up" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Next service date</label>
                  <input type="date" value={logForm.nextServiceDate ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, nextServiceDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Performed by</label>
                  <input value={logForm.performedBy ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, performedBy: e.target.value })} placeholder="Technician / agency" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <UploadField label="Attachment (bill / report)" value={logForm.attachmentId} onChange={(id) => setLogForm((f) => f && { ...f, attachmentId: id })} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Remarks</label>
                <textarea rows={2} value={logForm.remarks ?? ''} onChange={(e) => setLogForm((f) => f && { ...f, remarks: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setLogForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : logForm.id ? 'Update Log' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
