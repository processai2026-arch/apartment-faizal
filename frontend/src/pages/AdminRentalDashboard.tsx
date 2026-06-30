import { useState, useEffect } from 'react';
import { Home, Eye, Heart, Clock, CheckCircle, XCircle, Star, RefreshCcw, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { useRentalStore } from '@/stores/useRentalStore';
import type { RentalListing } from '@/types';

type Tab = 'overview' | 'listings';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function AdminRentalDashboard() {
  const { adminListings, dashboard, loadAdminListings, loadDashboard, approveListing, featureListing, adminDelete } = useRentalStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [approveDialog, setApproveDialog] = useState<{ listing: RentalListing; newStatus: string } | null>(null);
  const [comment, setComment] = useState('');

  const refresh = () => {
    setLoading(true);
    Promise.all([
      loadAdminListings({ search: search || undefined, status: statusFilter || undefined }),
      loadDashboard(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search, statusFilter]); // eslint-disable-line

  const handleApprove = async () => {
    if (!approveDialog) return;
    try {
      await approveListing(approveDialog.listing.id, approveDialog.newStatus, comment || undefined);
      toast.success(`Listing ${approveDialog.newStatus}`);
      setApproveDialog(null);
      setComment('');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleFeature = async (id: string, current: boolean) => {
    try { await featureListing(id, !current); toast.success(current ? 'Unfeatured' : 'Featured'); } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try { await adminDelete(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const stats = dashboard?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Rental Dashboard</h1>
          <p className="text-sm text-slate-500">Manage listings and approval queue</p>
        </div>
        <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['overview', 'listings'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Listings" value={stats.total} icon={Home} color="bg-indigo-500" />
            <StatCard label="Pending Approval" value={stats.pending} icon={Clock} color="bg-amber-500" />
            <StatCard label="Active" value={stats.active} icon={CheckCircle} color="bg-emerald-500" />
            <StatCard label="Featured" value={stats.featured} icon={Star} color="bg-sky-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} color="bg-violet-500" />
            <StatCard label="Total Saved" value={stats.totalFavorites.toLocaleString()} icon={Heart} color="bg-rose-500" />
          </div>

          {dashboard?.recentPending && dashboard.recentPending.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Pending Approval Queue</h2>
              <div className="space-y-3">
                {dashboard.recentPending.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{l.title}</p>
                      <p className="text-xs text-slate-500">{l.propertyType} · {l.listingType}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => setApproveDialog({ listing: l, newStatus: 'Active' })} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => setApproveDialog({ listing: l, newStatus: 'Rejected' })} className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search listings…" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="">All Statuses</option>
              {['Pending', 'Approved', 'Active', 'Rejected', 'Closed'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {adminListings.length === 0 ? (
            <EmptyState icon={Home} title="No listings found" description="Try adjusting filters." />
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 hidden md:table-cell">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {adminListings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{l.title}</p>
                        <p className="text-xs text-slate-500">{l.propertyType}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', l.listingType === 'Sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}>{l.listingType}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-800 dark:text-slate-200">
                        {l.price != null ? `₹${l.price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} size="sm" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {l.status === 'Pending' && <>
                            <button onClick={() => setApproveDialog({ listing: l, newStatus: 'Active' })} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setApproveDialog({ listing: l, newStatus: 'Rejected' })} className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100"><X className="h-3.5 w-3.5" /></button>
                          </>}
                          <button onClick={() => handleFeature(l.id, l.featured)} className={cn('rounded-lg p-1.5 transition-colors', l.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-700')}>
                            <Star className={cn('h-3.5 w-3.5', l.featured && 'fill-amber-500')} />
                          </button>
                          <button onClick={() => handleDelete(l.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Approve/Reject Dialog */}
      {approveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-1 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">
              {approveDialog.newStatus === 'Rejected' ? 'Reject' : 'Approve'} Listing
            </h3>
            <p className="mb-4 text-sm text-slate-500">{approveDialog.listing.title}</p>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Add a comment (optional)…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setApproveDialog(null); setComment(''); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button onClick={handleApprove} className={cn('rounded-xl px-4 py-2 text-sm font-medium text-white', approveDialog.newStatus === 'Rejected' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700')}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
