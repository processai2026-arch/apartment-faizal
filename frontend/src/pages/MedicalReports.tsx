import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, Plus, RefreshCcw, Pencil, Trash2, Upload, X, FileText, HeartPulse, CalendarClock, ShieldCheck, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import EmptyState from '@/components/features/EmptyState';
import { api } from '@/lib/api';
import { useMedicalStore } from '@/stores/useMedicalStore';
import type { MedicalReport, Staff } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010';

const TYPES: MedicalReport['reportType'][] = ['Fitness Certificate', 'Checkup', 'Injury', 'Insurance', 'Other'];
const RESULTS: MedicalReport['result'][] = ['Fit', 'Unfit', 'Follow-up', 'N/A'];

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const today = () => new Date().toISOString().slice(0, 10);

const RESULT_STYLE: Record<MedicalReport['result'], string> = {
  Fit: 'bg-emerald-50 text-emerald-700',
  Unfit: 'bg-rose-50 text-rose-700',
  'Follow-up': 'bg-amber-50 text-amber-700',
  'N/A': 'bg-slate-100 text-slate-600',
};

function ResultBadge({ result }: { result: MedicalReport['result'] }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', RESULT_STYLE[result])}>{result}</span>;
}

function CheckupBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-xs text-slate-400">—</span>;
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const overdue = days < 0;
  const soon = days >= 0 && days <= 30;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', overdue ? 'bg-rose-50 text-rose-700' : soon ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
      <CalendarClock className="h-3 w-3" /> {fmtDate(date)}{overdue ? ' (overdue)' : soon ? ` (${days}d)` : ''}
    </span>
  );
}

// ── Attachment upload field ──────────────────────────────────────────────────
function UploadField({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.create(file, 'medical');
      onChange(String(uploaded.id));
      toast.success('Report uploaded');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed'); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Scanned Report</label>
      <div className="flex items-center gap-2">
        <label className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors', value ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600')}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : value ? `Attached (#${value})` : 'Upload image / PDF'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" title="Remove" onClick={() => onChange(undefined)} className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><X className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MedicalReports() {
  const { reports, summary, loading, loadReports, loadSummary, createReport, updateReport, deleteReport } = useMedicalStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  const [form, setForm] = useState<Partial<MedicalReport> | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      loadReports({ report_type: typeFilter || undefined, result: resultFilter || undefined, due_checkup: dueOnly ? '1' : undefined }),
      loadSummary(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load reports'));
  }, [loadReports, loadSummary, typeFilter, resultFilter, dueOnly]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api.staff.list().then(setStaff).catch(() => undefined); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) { await updateReport(form.id, form); toast.success('Report updated'); }
      else { const created = await createReport(form); toast.success(`Report recorded — ${created.reportNo}`); }
      setForm(null);
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save report'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r: MedicalReport) => {
    if (!confirm(`Delete report ${r.reportNo} for ${r.personName}?`)) return;
    try { await deleteReport(r.id); toast.success('Report deleted'); loadSummary().catch(() => undefined); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const onPickStaff = (staffId: string) => {
    const s = staff.find((x) => x.id === staffId);
    setForm((f) => f && { ...f, staffId: staffId || undefined, personName: s ? s.name : f.personName });
  };

  const columns: Column<MedicalReport>[] = [
    { key: 'personName', label: 'Person', render: (r) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">{r.personName} {r.confidential && <ShieldCheck className="ml-1 inline h-3 w-3 text-slate-400" aria-label="Confidential" />}</p>
        <p className="text-xs text-slate-400">{r.reportNo}</p>
      </div>
    ) },
    { key: 'reportType', label: 'Type', render: (r) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">{r.reportType}</span> },
    { key: 'reportDate', label: 'Date', render: (r) => <div><p className="text-slate-700 dark:text-slate-300">{fmtDate(r.reportDate)}</p>{r.provider && <p className="text-xs text-slate-400">{r.provider}</p>}</div> },
    { key: 'result', label: 'Result', render: (r) => <ResultBadge result={r.result} /> },
    { key: 'nextCheckupDate', label: 'Next Checkup', render: (r) => <CheckupBadge date={r.nextCheckupDate} /> },
    { key: 'attachment', label: 'Report', render: (r) => r.attachment?.storedPath
      ? <a href={`${API_BASE}/${r.attachment.storedPath}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"><Paperclip className="h-3 w-3" /> View</a>
      : <span className="text-xs text-slate-300">—</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Medical Reports</h1>
          <p className="text-sm text-slate-500">Staff fitness certificates, checkups and health records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"><RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} /></button>
          <button onClick={() => setForm({ reportType: 'Checkup', result: 'N/A', reportDate: today(), confidential: true })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add Report</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Reports" value={summary?.total ?? 0} icon={FileText} color="indigo" />
        <StatCard label="Fit" value={summary?.fit ?? 0} icon={HeartPulse} color="green" />
        <StatCard label="Follow-up / Unfit" value={(summary?.followUp ?? 0) + (summary?.unfit ?? 0)} icon={Stethoscope} color="amber" />
        <StatCard label="Checkups Due (30d)" value={summary?.checkupsDue ?? 0} icon={CalendarClock} color="red" />
      </div>

      <DataTable
        data={reports}
        columns={columns}
        searchKeys={['personName', 'reportNo', 'provider']}
        searchPlaceholder="Search by person…"
        toolbar={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Types</option>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Result</label>
              <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Results</option>
                {RESULTS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} /> Due checkups only
            </label>
            {(typeFilter || resultFilter || dueOnly) && (
              <button onClick={() => { setTypeFilter(''); setResultFilter(''); setDueOnly(false); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700">Clear filters</button>
            )}
          </div>
        }
        empty={<EmptyState icon={Stethoscope} title="No medical reports" description="Record a fitness certificate or checkup for your staff." />}
        actions={(r) => (
          <>
            <button title="Edit" onClick={() => setForm(r)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
            <button title="Delete" onClick={() => handleDelete(r)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
          </>
        )}
      />

      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{form.id ? `Edit Report ${form.reportNo ?? ''}` : 'Add Medical Report'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Staff Member</label>
                  <select value={form.staffId ?? ''} onChange={(e) => onPickStaff(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <option value="">— Non-staff / manual —</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Person Name *</label>
                  <input required value={form.personName ?? ''} onChange={(e) => setForm((f) => f && { ...f, personName: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Report Type *</label>
                  <select required value={form.reportType ?? 'Checkup'} onChange={(e) => setForm((f) => f && { ...f, reportType: e.target.value as MedicalReport['reportType'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Result</label>
                  <select value={form.result ?? 'N/A'} onChange={(e) => setForm((f) => f && { ...f, result: e.target.value as MedicalReport['result'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {RESULTS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Report Date *</label>
                  <input required type="date" value={form.reportDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, reportDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Next Checkup</label>
                  <input type="date" value={form.nextCheckupDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, nextCheckupDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Provider (hospital / clinic)</label>
                <input value={form.provider ?? ''} onChange={(e) => setForm((f) => f && { ...f, provider: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Summary</label>
                <textarea rows={2} value={form.summary ?? ''} onChange={(e) => setForm((f) => f && { ...f, summary: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <UploadField value={form.attachmentId} onChange={(id) => setForm((f) => f && { ...f, attachmentId: id })} />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={form.confidential ?? true} onChange={(e) => setForm((f) => f && { ...f, confidential: e.target.checked })} /> Mark as confidential
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : form.id ? 'Update Report' : 'Save Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
