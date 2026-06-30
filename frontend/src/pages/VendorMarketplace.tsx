import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Heart, CalendarClock, SlidersHorizontal, Star, BadgeCheck, RefreshCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import StatusBadge from '@/components/features/StatusBadge';
import VendorCard from '@/components/features/VendorCard';
import StarRating from '@/components/features/StarRating';
import ReviewDialog from '@/components/features/ReviewDialog';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import { vendorRecommendationPayload } from '@/lib/whatsapp';
import { useVendorMarketplaceStore } from '@/stores/useVendorMarketplaceStore';
import type { MarketplaceVendor, VendorBooking } from '@/types';

type Tab = 'browse' | 'bookings' | 'favorites';

export default function VendorMarketplace() {
  const navigate = useNavigate();
  const {
    vendors, categories, myBookings, favorites,
    loadMarketplace, loadCategories, loadMyBookings, cancelMyBooking, toggleFavorite, isFavorite,
  } = useVendorMarketplaceStore();

  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minRating, setMinRating] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ vendor: MarketplaceVendor; bookingId?: string } | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      loadMarketplace({
        search: search || undefined,
        categoryId: categoryId || undefined,
        minRating: minRating || undefined,
        featured: featuredOnly ? '1' : undefined,
      }),
      loadMyBookings(),
    ])
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Could not load marketplace'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCategories().catch(() => {}); }, [loadCategories]);
  // Re-fetch when filters change (debounce-ish via effect dependencies).
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search, categoryId, minRating, featuredOnly]);

  const featured = useMemo(() => vendors.filter((v) => v.isFeatured), [vendors]);
  const favoriteVendors = useMemo(() => vendors.filter((v) => favorites.includes(v.id)), [vendors, favorites]);

  const open = (v: MarketplaceVendor) => navigate(`/tenant/marketplace/${v.id}`);

  const tabs: { key: Tab; label: string; icon: typeof Store; count?: number }[] = [
    { key: 'browse', label: 'Browse', icon: Store },
    { key: 'bookings', label: 'My Bookings', icon: CalendarClock, count: myBookings.length },
    { key: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
  ];

  const handleCancel = async (b: VendorBooking) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await cancelMyBooking(b.id); toast.success('Booking cancelled'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not cancel'); }
  };

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name || 'Vendor';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Vendor Marketplace</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Discover, book, and review verified service vendors</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300')}>
            <Icon className="h-4 w-4" /> {label}
            {count != null && count > 0 && (
              <span className={cn('rounded-full px-1.5 text-[11px]', tab === key ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700')}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-[200px] flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Search vendors, services, areas..." />
            </div>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800">
              <option value="">Any rating</option>
              <option value="4">4★ & up</option>
              <option value="3">3★ & up</option>
              <option value="2">2★ & up</option>
            </select>
            <button onClick={() => setFeaturedOnly((v) => !v)}
              className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                featuredOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300')}>
              <Star className={cn('h-4 w-4', featuredOnly && 'fill-amber-400 text-amber-400')} /> Featured
            </button>
            {(search || categoryId || minRating || featuredOnly) && (
              <button onClick={() => { setSearch(''); setCategoryId(''); setMinRating(''); setFeaturedOnly(false); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Featured strip */}
          {!search && !categoryId && !minRating && !featuredOnly && featured.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Featured Vendors
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((v) => (
                  <div key={v.id} className="relative group/wa">
                    <VendorCard vendor={v} isFavorite={isFavorite(v.id)} onToggleFavorite={toggleFavorite} onClick={open} />
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover/wa:opacity-100 transition-opacity">
                      <WhatsAppShareButton
                        size="sm"
                        variant="default"
                        payload={vendorRecommendationPayload({
                          vendorName: v.name,
                          serviceType: v.serviceType,
                          contact: v.contact,
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <SlidersHorizontal className="h-4 w-4" /> All Vendors
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
              </div>
            ) : vendors.length === 0 ? (
              <EmptyState icon={Store} title="No vendors found" description="Try adjusting your filters or search terms." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.map((v) => (
                  <div key={v.id} className="relative group/wa">
                    <VendorCard vendor={v} isFavorite={isFavorite(v.id)} onToggleFavorite={toggleFavorite} onClick={open} />
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover/wa:opacity-100 transition-opacity">
                      <WhatsAppShareButton
                        size="sm"
                        variant="default"
                        payload={vendorRecommendationPayload({
                          vendorName: v.name,
                          serviceType: v.serviceType,
                          contact: v.contact,
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'favorites' && (
        favoriteVendors.length === 0 ? (
          <EmptyState icon={Heart} title="No favorites yet" description="Tap the heart on any vendor to save it here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteVendors.map((v) => (
              <VendorCard key={v.id} vendor={v} isFavorite onToggleFavorite={toggleFavorite} onClick={open} />
            ))}
          </div>
        )
      )}

      {tab === 'bookings' && (
        myBookings.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No bookings yet" description="Your vendor bookings will appear here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  {['Vendor', 'Request', 'Scheduled', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {myBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{vendorName(b.vendorId)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.title}</td>
                    <td className="px-4 py-3 text-slate-500">{b.scheduledFor ? new Date(b.scheduledFor).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {b.status === 'Completed' && (
                          <button onClick={() => { const v = vendors.find((x) => x.id === b.vendorId); if (v) setReviewTarget({ vendor: v, bookingId: b.id }); else toast.error('Open the vendor to review'); }}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100">Review</button>
                        )}
                        {!['Completed', 'Cancelled'].includes(b.status) && (
                          <button onClick={() => handleCancel(b)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {reviewTarget && (
        <ReviewDialog
          vendor={reviewTarget.vendor}
          bookingId={reviewTarget.bookingId}
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
