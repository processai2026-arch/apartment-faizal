import { useState, useEffect } from 'react';
import { Users, Plus, QrCode, CheckSquare, RefreshCcw, LogIn, LogOut, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { useDailyWorkerStore } from '@/stores/useDailyWorkerStore';
import type { DailyWorker } from '@/types';

const WORKER_TYPES = ['Housekeeping', 'Security', 'Electrician', 'Plumber', 'Carpenter', 'Delivery', 'Gardener', 'General'];
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Leave'];
type Tab = 'workers' | 'attendance';

export default function DailyWorkers() {
  const { workers, todaySummary, loadWorkers, loadTodaySummary, createWorker, updateWorker, deleteWorker, generateQr, markAttendance, recordEntry, recordExit } = useDailyWorkerStore();
  const [tab, setTab] = useState<Tab>('workers');
  const [search, setSearch] = useState('');
  const [workerType, setWorkerType] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<DailyWorker> | null>(null);
  const [saving, setSaving] = useState(false);
  const [attendanceWorker, setAttendanceWorker] = useState<DailyWorker | null>(null);
  const [attStatus, setAttStatus] = useState<string>('Present');
  const [attNotes, setAttNotes] = useState('');

  const refresh = () => {
    setLoading(true);
    Promise.all([
      loadWorkers({ search: search || undefined, worker_type: workerType || undefined }),
      loadTodaySummary(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed')).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search, workerType]); // eslint-disable-line

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) { await updateWorker(form.id, form); toast.success('Worker updated'); }
      else { const w = await createWorker(form); toast.success(`Worker added. QR: ${w.qrCode ?? 'generated'}`); }
      setForm(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete worker?')) return;
    try { await deleteWorker(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const handleGenerateQr = async (id: string) => {
    try { const qr = await generateQr(id); toast.success(`New QR: ${qr}`); } catch { toast.error('Failed'); }
  };

  const handleMarkAttendance = async () => {
    if (!attendanceWorker) return;
    setSaving(true);
    try {
      await markAttendance(attendanceWorker.id, attStatus, attNotes || undefined);
      toast.success(`Attendance marked: ${attStatus}`);
      setAttendanceWorker(null);
      setAttStatus('Present');
      setAttNotes('');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleEntry = async (id: string) => {
    try { await recordEntry(id); toast.success('Entry recorded'); } catch { toast.error('Failed'); }
  };

  const handleExit = async (id: string) => {
    try { await recordExit(id); toast.success('Exit recorded'); } catch { toast.error('Failed'); }
  };

  const summary = todaySummary?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Daily Workers</h1>
          <p className="text-sm text-slate-500">Manage worker attendance and entry/exit</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setForm({ status: 'Active', workerType: 'General' })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Worker
          </button>
        </div>
      </div>

      {/* Today Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Present', summary.Present ?? 0, 'bg-emerald-500'], ['Absent', summary.Absent ?? 0, 'bg-rose-500'], ['Half Day', summary['Half Day'] ?? 0, 'bg-amber-500'], ['Leave', summary.Leave ?? 0, 'bg-slate-500']].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={cn('mb-2 h-1.5 w-8 rounded-full', color)} />
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-500">{label} Today</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['workers', 'attendance'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search workers…" /></div>
        <select value={workerType} onChange={(e) => setWorkerType(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <option value="">All Types</option>
          {WORKER_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {workers.length === 0 ? (
        <EmptyState icon={Users} title="No workers found" description="Add your first daily worker." />
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr className="text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 hidden md:table-cell">QR</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{w.name}</p>
                    {w.phone && <p className="text-xs text-slate-500">{w.phone}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">{w.workerType}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono dark:bg-slate-700">{w.qrCode ?? '—'}</code>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={w.status} size="sm" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Mark Attendance" onClick={() => setAttendanceWorker(w)} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><CheckSquare className="h-3.5 w-3.5" /></button>
                      <button title="Record Entry" onClick={() => handleEntry(w.id)} className="rounded-lg bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100"><LogIn className="h-3.5 w-3.5" /></button>
                      <button title="Record Exit" onClick={() => handleExit(w.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-700"><LogOut className="h-3.5 w-3.5" /></button>
                      <button title="Regenerate QR" onClick={() => handleGenerateQr(w.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-violet-50 hover:text-violet-600 dark:bg-slate-700"><QrCode className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setForm(w)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700"><Users className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(w.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Worker Modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{form.id ? 'Edit Worker' : 'Add Worker'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                <input required value={form.name ?? ''} onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Worker Type *</label>
                  <select value={form.workerType ?? 'General'} onChange={(e) => setForm((f) => f && { ...f, workerType: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {WORKER_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={form.phone ?? ''} onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                <input value={form.address ?? ''} onChange={(e) => setForm((f) => f && { ...f, address: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select value={form.status ?? 'Active'} onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as DailyWorker['status'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {['Active', 'Inactive', 'Blacklisted'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {attendanceWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-1 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Mark Attendance</h3>
            <p className="mb-4 text-sm text-slate-500">{attendanceWorker.name} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ATTENDANCE_STATUSES.map((s) => (
                <button key={s} onClick={() => setAttStatus(s)} className={cn('rounded-xl py-2.5 text-sm font-medium transition-colors', attStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300')}>
                  {s}
                </button>
              ))}
            </div>
            <textarea value={attNotes} onChange={(e) => setAttNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setAttendanceWorker(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button onClick={handleMarkAttendance} disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
