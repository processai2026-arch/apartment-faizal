import { useState, useEffect, useMemo } from 'react';
import { X, Wrench, UserCheck, RefreshCcw, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import { maintenanceReminderPayload } from '@/lib/whatsapp';
import DataTable, { NameCell, type Column } from '@/components/features/DataTable';
import TableToolbar from '@/components/features/TableToolbar';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import StatCard from '@/components/features/StatCard';
import { useAppStore } from '@/stores/useAppStore';
import type { MaintenanceRequestTicket } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['All', 'Open', 'Assigned', 'In Progress', 'Completed', 'Cancelled'] as const;
const STATUS_OPTIONS: MaintenanceRequestTicket['status'][] = ['Open', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

export default function AdminMaintenance() {
  const {
    maintenanceRequests, vendors, staff,
    loadAdminMaintenanceRequests, assignMaintenanceVendor, assignMaintenanceStaff, updateMaintenanceStatus, removeMaintenanceRequest,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('All');
  const [selected, setSelected] = useState<MaintenanceRequestTicket | null>(null);
  const [assignVendorId, setAssignVendorId] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [statusValue, setStatusValue] = useState<MaintenanceRequestTicket['status']>('Open');
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    loadAdminMaintenanceRequests().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not load maintenance requests');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) {
      setAssignVendorId(selected.assignedVendorId || '');
      setAssignStaffId(selected.assignedStaffId || '');
      setStatusValue(selected.status);
      setRemarks('');
    }
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
  const emergencyCount = maintenanceRequests.filter((m) => m.priority === 'Emergency' && m.status !== 'Completed' && m.status !== 'Cancelled').length;
  const completedCount = maintenanceRequests.filter((m) => m.status === 'Completed').length;

  const vendorName = (id?: string) => vendors.find((v) => v.id === id)?.name;
  const staffName = (id?: string) => staff.find((s) => s.id === id)?.name;

  const columns: Column<MaintenanceRequestTicket>[] = [
    { key: 'title', label: 'Request', render: (m) => <NameCell name={m.title} subtitle={m.category} /> },
    { key: 'priority', label: 'Priority', render: (m) => <StatusBadge status={m.priority} size="sm" /> },
    { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.status} /> },
    { key: 'assignedVendorId', label: 'Vendor', render: (m) => vendorName(m.assignedVendorId) || <span className="text-slate-400">Unassigned</span> },
    { key: 'assignedStaffId', label: 'Staff', render: (m) => staffName(m.assignedStaffId) || <span className="text-slate-400">Unassigned</span> },
    { key: 'createdAt', label: 'Raised', render: (m) => m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—' },
  ];

  const handleAssignVendor = async () => {
    if (!selected || !assignVendorId) { toast.error('Select a vendor'); return; }
    setSaving(true);
    try {
      await assignMaintenanceVendor(selected.id, assignVendorId, remarks);
      toast.success('Vendor assigned');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not assign vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selected || !assignStaffId) { toast.error('Select a staff member'); return; }
    setSaving(true);
    try {
      await assignMaintenanceStaff(selected.id, assignStaffId, remarks);
      toast.success('Staff assigned');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not assign staff');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateMaintenanceStatus(selected.id, statusValue, remarks);
      toast.success('Status updated');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: MaintenanceRequestTicket) => {
    if (!window.confirm(`Delete maintenance request "${m.title}"?`)) return;
    try {
      await removeMaintenanceRequest(m.id);
      toast.success('Maintenance request deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete request');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Maintenance Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track, assign, and resolve tenant maintenance requests</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={maintenanceRequests.length} icon={Wrench} color="indigo" />
        <StatCard label="Open / In Progress" value={openCount} icon={RefreshCcw} color="amber" />
        <StatCard label="Emergency (Unresolved)" value={emergencyCount} icon={Wrench} color="red" />
        <StatCard label="Completed" value={completedCount} icon={UserCheck} color="green" />
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
            filters={<SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />}
            actions={
              <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCcw className="w-4 h-4" /> Refresh
              </button>
            }
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading maintenance requests…</div>
        ) : (
          <DataTable
            data={filtered as unknown as Record<string, unknown>[]}
            columns={columns as never[]}
            hideSearch
            rowId={(m) => (m as unknown as MaintenanceRequestTicket).id}
            empty={
              <EmptyState
                icon={Wrench}
                title="No maintenance requests found"
                description={search || statusFilter !== 'All' ? 'No requests match your filters.' : 'Tenant maintenance requests will appear here.'}
              />
            }
            actions={(m: unknown) => {
              const request = m as MaintenanceRequestTicket;
              return (
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(request)}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                    <UserCheck className="w-3 h-3" /> Manage
                  </button>
                  <button onClick={() => handleDelete(request)}
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
              <h3 className="text-lg font-semibold font-[Outfit]">{selected.title}</h3>
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
                  payload={maintenanceReminderPayload({
                    ticketId: selected.id,
                    title: selected.title,
                    scheduledDate: selected.expectedCompletion
                      ? new Date(selected.expectedCompletion).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'To be scheduled',
                    assignee: vendorName(selected.assignedVendorId) || staffName(selected.assignedStaffId) || undefined,
                  })}
                />
              </div>
            </div>

            {selected.category === 'Electrical' && (selected.electricalPhaseType || selected.electricalWorkType) && (
              <div className="flex flex-wrap items-center gap-2 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <span className="text-xs font-medium text-amber-800">Electrical:</span>
                {selected.electricalPhaseType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                    {selected.electricalPhaseType}
                  </span>
                )}
                {selected.electricalWorkType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                    {selected.electricalWorkType}
                  </span>
                )}
                <span className="text-xs text-amber-700 ml-auto">C/E licence required</span>
              </div>
            )}
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
                  <button onClick={handleAssignVendor} disabled={saving || !assignVendorId}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    Assign
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Assign Staff</label>
                <div className="flex gap-2">
                  <select value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">Select staff…</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                  <button onClick={handleAssignStaff} disabled={saving || !assignStaffId}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    Assign
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Update Status</label>
                <div className="flex gap-2">
                  <select value={statusValue} onChange={(e) => setStatusValue(e.target.value as MaintenanceRequestTicket['status'])}
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
