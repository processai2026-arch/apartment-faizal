import { useState, useEffect, useMemo } from 'react';
import { Store, BadgeCheck, Star, CalendarCheck, MessageSquare, RefreshCcw, Eye, EyeOff, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import StarRating from '@/components/features/StarRating';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import { useVendorMarketplaceStore } from '@/stores/useVendorMarketplaceStore';
import type { VendorBooking, VendorReview, MarketplaceVendor } from '@/types';

type Tab = 'overview' | 'vendors' | 'reviews' | 'bookings';

const STATUS_COLORS: Record<string, string> = {
  Requested: '#f59e0b', Confirmed: '#3b82f6', 'In Progress': '#6366f1', Completed: '#22c55e', Cancelled: '#94a3b8',
  Pending: '#f59e0b', Approved: '#22c55e', Hidden: '#94a3b8',
};

export default function AdminVendorDashboard() {
  const {
    dashboard, adminVendors, reviews, bookings,
    loadDashboard, loadAdminVendors, loadReviews, loadBookings,
    verifyVendor, featureVendor, setVendorRating, moderateReview, setBookingStatus,
  } = useVendorMarketplaceStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Set Rating dialog state
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; vendor: MarketplaceVendor | null; value: number }>({
    open: false, vendor: null, value: 0,
  });

  const refresh = () => {
    setLoading(true);
    Promise.all([loadDashboard(), loadAdminVendors(), loadReviews(), loadBookings()])
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load vendor data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const stats = dashboard?.stats;

  const bookingChart = useMemo(
    () => (stats?.bookingsByStatus ?? []).map((b) => ({ name: b.status, value: b.count })),
    [stats]
  );
  const reviewChart = useMemo(
    () => (stats?.reviewsByStatus ?? []).map((r) => ({ name: r.status, value: r.count })),
    [stats]
  );

  const filteredVendors = useMemo(() => {
    if (!search) return adminVendors;
    const q = search.toLowerCase();
    return adminVendors.filter((v) => [v.name, v.company, v.serviceType].some((f) => String(f).toLowerCase().includes(q)));
  }, [adminVendors, search]);

  const filteredReviews = useMemo(
    () => (reviewFilter ? reviews.filter((r) => r.status === reviewFilter) : reviews),
    [reviews, reviewFilter]
  );

  const vendorName = (id: string) => adminVendors.find((v) => v.id === id)?.name || `Vendor #${id}`;

  const handleModerate = async (r: VendorReview, status: VendorReview['status']) => {
    try { await moderateReview(r.id, status); toast.success(`Review ${status.toLowerCase()}`); await loadDashboard(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update review'); }
  };

  const handleBookingStatus = async (b: VendorBooking, status: VendorBooking['status']) => {
    try { await setBookingStatus(b.id, status); toast.success(`Booking ${status.toLowerCase()}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update booking'); }
  };

  const openRatingDialog = (v: MarketplaceVendor) => {
    setRatingDialog({ open: true, vendor: v, value: Math.round(v.ratingAvg) || 0 });
  };

  const handleSetRating = async () => {
    if (!ratingDialog.vendor) return;
    if (ratingDialog.value < 1 || ratingDialog.value > 5) {
      toast.error('Please select a star rating between 1 and 5');
      return;
    }
    try {
      await setVendorRating(ratingDialog.vendor.id, ratingDialog.value);
      toast.success(`Rating updated to ${ratingDialog.value} stars`);
      setRatingDialog({ open: false, vendor: null, value: 0 });
      await loadDashboard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update rating');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'bookings', label: 'Bookings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900">Vendor Marketplace</h1>
          <p className="mt-0.5 text-sm text-slate-500">Analytics, moderation, and vendor management</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Vendors" value={stats?.vendors.total ?? 0} icon={Store} color="indigo" />
        <StatCard label="Verified" value={stats?.vendors.verified ?? 0} icon={BadgeCheck} color="blue" />
        <StatCard label="Featured" value={stats?.vendors.featured ?? 0} icon={Star} color="amber" />
        <StatCard label="Avg Rating" value={(stats?.vendors.avgRating ?? 0).toFixed(1)} icon={Star} color="green" />
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-all', tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-[Outfit] font-semibold text-slate-900">Bookings by Status</h3>
              {bookingChart.length === 0 ? <p className="text-sm text-slate-400">No bookings yet.</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bookingChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {bookingChart.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#6366f1'} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-[Outfit] font-semibold text-slate-900">Reviews by Status</h3>
              {reviewChart.length === 0 ? <p className="text-sm text-slate-400">No reviews yet.</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={reviewChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {reviewChart.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#6366f1'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top rated + most booked */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-[Outfit] font-semibold text-slate-900"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Top Rated Vendors</h3>
              {(dashboard?.topRated ?? []).length === 0 ? <p className="text-sm text-slate-400">No rated vendors yet.</p> : (
                <div className="divide-y divide-slate-50">
                  {dashboard?.topRated.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2.5">
                      <div><p className="text-sm font-medium text-slate-800">{v.name}</p><p className="text-xs text-slate-500">{v.company}</p></div>
                      <StarRating value={Number(v.rating_avg)} size="sm" showValue count={Number(v.review_count)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-[Outfit] font-semibold text-slate-900"><CalendarCheck className="h-4 w-4 text-indigo-500" /> Most Booked Vendors</h3>
              {(dashboard?.mostBooked ?? []).length === 0 ? <p className="text-sm text-slate-400">No bookings yet.</p> : (
                <div className="divide-y divide-slate-50">
                  {dashboard?.mostBooked.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2.5">
                      <div><p className="text-sm font-medium text-slate-800">{v.name}</p><p className="text-xs text-slate-500">{v.company}</p></div>
                      <span className="text-sm font-semibold text-indigo-600">{Number(v.booking_count)} bookings</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent reviews */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-[Outfit] font-semibold text-slate-900"><MessageSquare className="h-4 w-4 text-indigo-500" /> Recent Reviews</h3>
            {(dashboard?.recentReviews ?? []).length === 0 ? <p className="text-sm text-slate-400">No reviews yet.</p> : (
              <div className="divide-y divide-slate-50">
                {dashboard?.recentReviews.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <StarRating value={r.rating} size="sm" />
                      <span className="text-sm text-slate-700">{r.title || r.comment || 'No comment'}</span>
                    </div>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'vendors' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4"><SearchInput value={search} onChange={setSearch} placeholder="Search vendors..." /></div>
          {filteredVendors.length === 0 ? <div className="p-8"><EmptyState icon={Store} title="No vendors" description="No vendors match your search." /></div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                {['Vendor', 'Service', 'Rating', 'Bookings', 'Flags', 'Actions'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{v.name}</p><p className="text-xs text-slate-500">{v.company}</p></td>
                    <td className="px-4 py-3 text-slate-600">{v.serviceType}</td>
                    <td className="px-4 py-3"><StarRating value={v.ratingAvg} size="sm" showValue count={v.reviewCount} /></td>
                    <td className="px-4 py-3 text-slate-600">{v.bookingCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {v.isVerified && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">Verified</span>}
                        {v.isFeatured && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => verifyVendor(v.id, !v.isVerified).then(() => toast.success(v.isVerified ? 'Unverified' : 'Verified')).catch(() => toast.error('Failed'))}
                          className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-medium', v.isVerified ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100')}>
                          {v.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                        <button onClick={() => featureVendor(v.id, !v.isFeatured).then(() => toast.success(v.isFeatured ? 'Unfeatured' : 'Featured')).catch(() => toast.error('Failed'))}
                          className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-medium', v.isFeatured ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100')}>
                          {v.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button onClick={() => openRatingDialog(v)}
                          className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100">
                          <Star className="h-3 w-3" /> Set Rating
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

      {tab === 'reviews' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 p-4">
            {['', 'Pending', 'Approved', 'Hidden'].map((s) => (
              <button key={s || 'all'} onClick={() => setReviewFilter(s)}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', reviewFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {s || 'All'}
              </button>
            ))}
          </div>
          {filteredReviews.length === 0 ? <div className="p-8"><EmptyState icon={MessageSquare} title="No reviews" description="No reviews match this filter." /></div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                {['Vendor', 'Rating', 'Review', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{vendorName(r.vendorId)}</td>
                    <td className="px-4 py-3"><StarRating value={r.rating} size="sm" /></td>
                    <td className="px-4 py-3 text-slate-600">{r.title && <span className="font-medium">{r.title}. </span>}{r.comment || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.status !== 'Approved' && (
                          <button onClick={() => handleModerate(r, 'Approved')} className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"><Check className="h-3 w-3" /> Approve</button>
                        )}
                        {r.status !== 'Hidden' && (
                          <button onClick={() => handleModerate(r, 'Hidden')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><EyeOff className="h-3 w-3" /> Hide</button>
                        )}
                        {r.status === 'Hidden' && (
                          <button onClick={() => handleModerate(r, 'Pending')} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><Eye className="h-3 w-3" /> Unhide</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {bookings.length === 0 ? <div className="p-8"><EmptyState icon={CalendarCheck} title="No bookings" description="Vendor bookings will appear here." /></div> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                {['Vendor', 'Request', 'Scheduled', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{vendorName(b.vendorId)}</td>
                    <td className="px-4 py-3 text-slate-600">{b.title}</td>
                    <td className="px-4 py-3 text-slate-500">{b.scheduledFor ? new Date(b.scheduledFor).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <select value={b.status} onChange={(e) => handleBookingStatus(b, e.target.value as VendorBooking['status'])}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {['Requested', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Set Rating Dialog */}
      {ratingDialog.open && ratingDialog.vendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRatingDialog({ open: false, vendor: null, value: 0 })}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-[Outfit] text-base font-semibold text-slate-900">Set Vendor Rating</h3>
              <button onClick={() => setRatingDialog({ open: false, vendor: null, value: 0 })} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Manually override the rating for <span className="font-medium text-slate-700">{ratingDialog.vendor.name}</span>.
            </p>
            <div className="mb-5 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingDialog((d) => ({ ...d, value: star }))}
                  className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={cn('h-8 w-8 transition-colors', star <= ratingDialog.value ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300')}
                  />
                </button>
              ))}
            </div>
            <p className="mb-5 text-center text-sm font-medium text-slate-600">
              {ratingDialog.value > 0 ? `${ratingDialog.value} out of 5 stars` : 'Select a rating'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRatingDialog({ open: false, vendor: null, value: 0 })}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetRating}
                disabled={ratingDialog.value === 0}
                className={cn('flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors',
                  ratingDialog.value > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'cursor-not-allowed bg-slate-300')}
              >
                Save Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
