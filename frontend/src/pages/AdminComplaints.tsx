import { useState, useEffect, useMemo } from 'react';
import { X, MessageSquareWarning, UserCheck, RefreshCcw, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import { complaintUpdatePayload } from '@/lib/whatsapp';
import DataTable, { NameCell, type Column } from '@/components/features/DataTable';
import TableToolbar from '@/components/features/TableToolbar';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import StatCard from '@/components/features/StatCard';
import { useAppStore } from '@/stores/useAppStore';
import type { ComplaintTicket } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['All', 'Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'] as const;
const STATUS_OPTIONS: ComplaintTicket['status'][] = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export default function AdminComplaints() {
  const { complaintTickets, vendors, loadAdminComplaints, assignComplaint, updateComplaintStatus, removeComplaint } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('All');
  const [selected, setSelected] = useState<ComplaintTicket | null>(null);
  const [assignVendorId, setAssignVendorId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [statusValue, setStatusValue] = useState<ComplaintTicket['status']>('Open');
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    loadAdminComplaints().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not load complaints');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) {
      setAssignVendorId(selected.assignedVendorId || '');
      setStatusValue(selected.status);
      setRemarks('');
    }
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
  const emergencyCount = complaintTickets.filter((c) => c.priority === 'Emergency' && c.status !== 'Resolved' && c.status !== 'Closed').length;
  const resolvedCount = complaintTickets.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  const vendorName = (id?: string) => vendors.find((v) => v.id === id)?.name;

  const columns: Column<ComplaintTicket>[] = [
    { key: 'subject', label: 'Complaint', render: (c) => <NameCell name={c.subject} subtitle={c.category} /> },
    { key: 'priority', label: 'Priority', render: (c) => <StatusBadge status={c.priority} size="sm" /> },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'assignedVendorId', label: 'Assigned To', render: (c) => vendorName(c.assignedVendorId) || <span className="text-slate-400">Unassigned</span> },
    { key: 'createdAt', label: 'Raised', render: (c) => c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—' },
  ];

  const handleAssign = async () => {
    if (!selected || !assignVendorId) { toast.error('Select a vendor'); return; }
    setSaving(true);
    try {
      await assignComplaint(selected.id, assignVendorId, remarks);
      toast.success('Vendor assigned');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not assign vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateComplaintStatus(selected.id, statusValue, remarks);
      toast.success('Status updated');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ComplaintTicket) => {
    if (!window.confirm(`Delete complaint "${c.subject}"?`)) return;
    try {
      await removeComplaint(c.id);
      toast.success('Complaint deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete complaint');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Complaint Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track, assign, and resolve tenant complaints</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Complaints" value={complaintTickets.length} icon={MessageSquareWarning} color="indigo" />
        <StatCard label="Open / In Progress" value={openCount} icon={RefreshCcw} color="amber" />
        <StatCard label="Emergency (Unresolved)" value={emergencyCount} icon={MessageSquareWarning} color="red" />
        <StatCard label="Resolved / Closed" value={resolvedCount} icon={UserCheck} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-4">
          <TableToolbar
            title={
              <div className="flex bg-slate-100 rounded-xl p-1 overflow-x-auto">
                {STATUS_FILTERS.map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                      statusFilter === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
                    {s}
                  </button>
                ))}
              </div>
            }
            filters={<SearchInput value={search} onChange={setSearch} placeholder="Search complaints..." />}
            actions={
              <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCcw className="w-4 h-4" /> Refresh
              </button>
            }
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading complaints…</div>
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            hideSearch
            rowId={(c) => c.id}
            empty={
              <EmptyState
                icon={MessageSquareWarning}
                title="No complaints found"
                description={search || statusFilter !== 'All' ? 'No complaints match your filters.' : 'Tenant complaints will appear here.'}
              />
            }
            actions={(complaint) => {
              return (
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(complaint)}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                    <UserCheck className="w-3 h-3" /> Manage
                  </button>
                  <button onClick={() => handleDelete(complaint)}
                    className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            }}
          />
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-[Outfit]">{selected.subject}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={selected.priority} size="sm" />
              <StatusBadge status={selected.status} />
              <span className="text-xs text-slate-400">{selected.category}</span>
              <div className="ml-auto">
                <WhatsAppShareButton
                  size="sm"
                  variant="outline"
                  payload={complaintUpdatePayload({
                    ticketId: selected.id,
                    subject: selected.subject,
                    status: selected.status,
                    remarks: remarks || undefined,
                  })}
                />
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-6">{selected.description}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Assign Vendor</label>
                <div className="flex gap-2">
                  <select value={assignVendorId} onChange={(e) => setAssignVendorId(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">Select vendor…</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.serviceType})</option>)}
                  </select>
                  <button onClick={handleAssign} disabled={saving || !assignVendorId}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    Assign
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Update Status</label>
                <div className="flex gap-2">
                  <select value={statusValue} onChange={(e) => setStatusValue(e.target.value as ComplaintTicket['status'])}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={handleStatusChange} disabled={saving}
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                    Update
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Remarks (optional)</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
                  placeholder="Add a note for this update..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-900 mt-6 mb-2">History</h4>
            {!selected.history || selected.history.length === 0 ? (
              <p className="text-xs text-slate-400">No updates yet.</p>
            ) : (
              <div className="space-y-3">
                {selected.history.map((h) => (
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
