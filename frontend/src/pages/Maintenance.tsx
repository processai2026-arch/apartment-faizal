import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Wrench, Paperclip, Clock, Ban, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import SearchInput from '@/components/features/SearchInput';
import StatCard from '@/components/features/StatCard';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import type { MaintenanceRequestTicket } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Lift', 'Carpentry', 'Painting', 'HVAC', 'Appliance', 'Other'];
const PRIORITIES: MaintenanceRequestTicket['priority'][] = ['Low', 'Medium', 'High', 'Emergency'];
const STATUS_FILTERS = ['All', 'Open', 'Assigned', 'In Progress', 'Completed', 'Cancelled'] as const;

const ELECTRICAL_PHASE_TYPES = ['Single Phase (1-Phase)', 'Two Phase (2-Phase)', 'Three Phase (3-Phase)'];
const ELECTRICAL_WORK_TYPES = ['General Repair', 'New Connection', 'Load Enhancement', 'Short Circuit Fix', 'Meter Work', 'Other'];

const emptyForm = { category: CATEGORIES[0], title: '', description: '', priority: 'Low' as MaintenanceRequestTicket['priority'], expectedCompletion: '', electricalPhaseType: '', electricalWorkType: '' };

export default function Maintenance() {
  const { maintenanceRequests, loadTenantMaintenanceRequests, createTenantMaintenanceRequest, cancelTenantMaintenanceRequest } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('All');
  const [selected, setSelected] = useState<MaintenanceRequestTicket | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MaintenanceRequestTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadTenantMaintenanceRequests().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not load maintenance requests');
    }).finally(() => setLoading(false));
  }, [loadTenantMaintenanceRequests]);

  useEffect(() => {
    if (!selected) { setSelectedDetail(null); return; }
    setSelectedDetail(selected);
    setLoadingDetail(true);
    api.maintenanceRequests.tenantShow(selected.id).then((full) => {
      setSelectedDetail(full);
    }).catch(() => {
      // fallback to list row if show fails
    }).finally(() => setLoadingDetail(false));
  }, [selected]);

  const filtered = useMemo(() => {
    let rows = maintenanceRequests;
    if (statusFilter !== 'All') rows = rows.filter((m) => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((m) => [m.title, m.description, m.category].some((f) => f.toLowerCase().includes(q)));
    }
    return rows;
  }, [maintenanceRequests, statusFilter, search]);

  const openCount = maintenanceRequests.filter((m) => m.status !== 'Completed' && m.status !== 'Cancelled').length;
  const completedCount = maintenanceRequests.filter((m) => m.status === 'Completed').length;

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      toast.error('Please fill title and description');
      return;
    }
    setSubmitting(true);
    try {
      let attachmentId: number | undefined;
      if (file) {
        const uploaded = await api.uploads.create(file, 'maintenance');
        attachmentId = uploaded.id;
      }
      await createTenantMaintenanceRequest({
        ...form,
        attachmentId,
        expectedCompletion: form.expectedCompletion || undefined,
        electricalPhaseType: form.category === 'Electrical' && form.electricalPhaseType ? form.electricalPhaseType : undefined,
        electricalWorkType: form.category === 'Electrical' && form.electricalWorkType ? form.electricalWorkType : undefined,
      });
      toast.success('Maintenance request submitted');
      setShowModal(false);
      setForm(emptyForm);
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    setCancelling(true);
    try {
      await cancelTenantMaintenanceRequest(selected.id);
      toast.success('Request cancelled');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not cancel request');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Maintenance Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">Raise requests and track repair status</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Raise Request
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Requests" value={maintenanceRequests.length} icon={Wrench} color="indigo" />
        <StatCard label="Open / In Progress" value={openCount} icon={Clock} color="amber" />
        <StatCard label="Completed" value={completedCount} icon={Wrench} color="green" />
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." className="max-w-xs" />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading maintenance requests…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance requests yet"
            description={search || statusFilter !== 'All' ? 'No requests match your filters.' : 'Raise a request and track its progress here.'}
            action={search || statusFilter !== 'All' ? undefined : { label: 'Raise Request', icon: Plus, onClick: () => setShowModal(true) }}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((m) => (
              <button key={m.id} onClick={() => setSelected(m)} className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">{m.title}</p>
                    <span className="text-xs text-slate-400">#{m.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{m.category} • {m.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={m.priority} size="sm" />
                  <StatusBadge status={m.status} />
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
              <h3 className="text-lg font-semibold font-[Outfit]">Raise Maintenance Request</h3>
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
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as MaintenanceRequestTicket['priority'] }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {form.category === 'Electrical' && (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Phase Type</label>
                      <select value={form.electricalPhaseType} onChange={(e) => setForm((f) => ({ ...f, electricalPhaseType: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                        <option value="">Select phase…</option>
                        {ELECTRICAL_PHASE_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Electrical Work Type</label>
                      <select value={form.electricalWorkType} onChange={(e) => setForm((f) => ({ ...f, electricalWorkType: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                        <option value="">Select work type…</option>
                        {ELECTRICAL_WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 font-medium">Note: Electrical work requires licensed electrician (C/E licence as per regulations)</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. AC not cooling"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4} placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Expected Completion (optional)</label>
                <input type="date" value={form.expectedCompletion} onChange={(e) => setForm((f) => ({ ...f, expectedCompletion: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-[Outfit]">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={selected.priority} size="sm" />
              <StatusBadge status={(selectedDetail ?? selected).status} />
              <span className="text-xs text-slate-400">{selected.category}</span>
            </div>
            <p className="text-sm text-slate-700 mb-4">{selected.description}</p>

            {!['Completed', 'Cancelled'].includes(selected.status) && (
              <button onClick={handleCancel} disabled={cancelling}
                className="flex items-center gap-1.5 px-3 py-2 mb-6 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                <Ban className="w-4 h-4" /> {cancelling ? 'Cancelling…' : 'Cancel Request'}
              </button>
            )}

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
