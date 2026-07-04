import { useState, useEffect, useMemo } from 'react';
import { Plus, X, MessageSquareWarning, Paperclip, Clock, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import SearchInput from '@/components/features/SearchInput';
import StatCard from '@/components/features/StatCard';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import type { ComplaintTicket } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Lift', 'Security', 'Internet', 'HVAC', 'Parking', 'Other'];
const PRIORITIES: ComplaintTicket['priority'][] = ['Low', 'Medium', 'High', 'Emergency'];
const STATUS_FILTERS = ['All', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'] as const;

const emptyForm = { category: CATEGORIES[0], subject: '', description: '', priority: 'Low' as ComplaintTicket['priority'] };

export default function Complaints() {
  const { complaintTickets, loadTenantComplaints, createTenantComplaint } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('All');
  const [selected, setSelected] = useState<ComplaintTicket | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ComplaintTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadTenantComplaints().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not load complaints');
    }).finally(() => setLoading(false));
  }, [loadTenantComplaints]);

  useEffect(() => {
    if (!selected) { setSelectedDetail(null); return; }
    setSelectedDetail(selected);
    setLoadingDetail(true);
    api.complaints.tenantShow(selected.id).then((full) => {
      setSelectedDetail(full);
    }).catch(() => {
      // fallback to list row if show fails
    }).finally(() => setLoadingDetail(false));
  }, [selected]);

  const filtered = useMemo(() => {
    let rows = complaintTickets;
    if (statusFilter !== 'All') rows = rows.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => [c.subject, c.description, c.category].some((f) => f.toLowerCase().includes(q)));
    }
    return rows;
  }, [complaintTickets, statusFilter, search]);

  const openCount = complaintTickets.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length;
  const resolvedCount = complaintTickets.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  const handleSubmit = async () => {
    if (!form.subject || !form.description) {
      toast.error('Please fill subject and description');
      return;
    }
    setSubmitting(true);
    try {
      let attachmentId: number | undefined;
      if (file) {
        const uploaded = await api.uploads.create(file, 'complaints');
        attachmentId = uploaded.id;
      }
      await createTenantComplaint({ ...form, attachmentId });
      toast.success('Complaint submitted');
      setShowModal(false);
      setForm(emptyForm);
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Complaints</h1>
          <p className="text-sm text-slate-500 mt-0.5">Raise issues and track resolution status</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Raise Complaint
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Complaints" value={complaintTickets.length} icon={MessageSquareWarning} color="indigo" />
        <StatCard label="Open / In Progress" value={openCount} icon={Clock} color="amber" />
        <StatCard label="Resolved / Closed" value={resolvedCount} icon={MessageSquareWarning} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex bg-slate-100 rounded-xl p-1 overflow-x-auto">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  statusFilter === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
                {s}
              </button>
            ))}
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search complaints..." className="max-w-xs" />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading complaints…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquareWarning}
            title="No complaints yet"
            description={search || statusFilter !== 'All' ? 'No complaints match your filters.' : 'Raise a complaint and track its resolution here.'}
            action={search || statusFilter !== 'All' ? undefined : { label: 'Raise Complaint', icon: Plus, onClick: () => setShowModal(true) }}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">{c.subject}</p>
                    <span className="text-xs text-slate-400">#{c.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{c.category} • {c.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={c.priority} size="sm" />
                  <StatusBadge status={c.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Raise Complaint</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as ComplaintTicket['priority'] }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Leaking tap in restroom"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4} placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Attach Image (optional)</label>
                <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 cursor-pointer hover:bg-slate-50">
                  <Paperclip className="w-4 h-4" />
                  {file ? file.name : 'Choose a file'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-[Outfit]">{selected.subject}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={selected.priority} size="sm" />
              <StatusBadge status={(selectedDetail ?? selected).status} />
              <span className="text-xs text-slate-400">{selected.category}</span>
            </div>
            <p className="text-sm text-slate-700 mb-6">{selected.description}</p>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">History</h4>
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Loading updates…</div>
            ) : !selectedDetail?.history || selectedDetail.history.length === 0 ? (
              <p className="text-xs text-slate-400">No updates yet.</p>
            ) : (
              <div className="space-y-3">
                {selectedDetail.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700">{h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}</p>
                      {h.remarks && <p className="text-xs text-slate-500">{h.remarks}</p>}
                      <p className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
