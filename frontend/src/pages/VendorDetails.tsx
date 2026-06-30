import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Heart, MapPin, Clock, Phone, CalendarCheck, MessageSquare, Image as ImageIcon, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StarRating from '@/components/features/StarRating';
import StatusBadge from '@/components/features/StatusBadge';
import BookingDialog from '@/components/features/BookingDialog';
import ReviewDialog from '@/components/features/ReviewDialog';
import EmptyState from '@/components/features/EmptyState';
import { useVendorMarketplaceStore } from '@/stores/useVendorMarketplaceStore';
import type { MarketplaceVendor } from '@/types';

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadVendorDetail, toggleFavorite, isFavorite } = useVendorMarketplaceStore();

  const [vendor, setVendor] = useState<MarketplaceVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    loadVendorDetail(id)
      .then(setVendor)
      .catch((e) => { toast.error(e instanceof Error ? e.message : 'Vendor not found'); navigate('/tenant/marketplace'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>;
  }
  if (!vendor) return null;

  const dist = vendor.reviewDistribution || {};
  const totalRated = Object.values(dist).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/tenant/marketplace')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-2xl font-bold text-white">
              {vendor.company?.charAt(0).toUpperCase() || vendor.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">{vendor.name}</h1>
                {vendor.isVerified && <BadgeCheck className="h-5 w-5 text-sky-500" />}
                {vendor.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured</span>}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.company}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <StarRating value={vendor.ratingAvg} size="sm" showValue count={vendor.reviewCount} />
                <span className="inline-flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" /> {vendor.bookingCount} bookings</span>
                {vendor.serviceArea && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {vendor.serviceArea}</span>}
                {vendor.availability && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {vendor.availability}</span>}
                <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {vendor.contact}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleFavorite(vendor.id)}
              className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                isFavorite(vendor.id) ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300')}>
              <Heart className={cn('h-4 w-4', isFavorite(vendor.id) && 'fill-rose-500 text-rose-500')} /> {isFavorite(vendor.id) ? 'Saved' : 'Favorite'}
            </button>
            <button onClick={() => setShowReview(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
              <MessageSquare className="h-4 w-4" /> Review
            </button>
            <button onClick={() => setShowBooking(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
              <CalendarCheck className="h-4 w-4" /> Book Now
            </button>
          </div>
        </div>
        {vendor.description && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{vendor.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: services + gallery + reviews */}
        <div className="space-y-6 lg:col-span-2">
          {/* Services */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Services</h2>
            {!vendor.services || vendor.services.length === 0 ? (
              <p className="text-sm text-slate-400">No services listed.</p>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {vendor.services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                    </div>
                    {s.price != null && <span className="text-sm font-semibold text-indigo-600">₹{s.price.toLocaleString()}{s.unit ? `/${s.unit}` : ''}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Gallery */}
          {vendor.gallery && vendor.gallery.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Gallery</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {vendor.gallery.map((g) => (
                  <div key={g.id} className="flex aspect-video flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800">
                    <ImageIcon className="h-6 w-6" />
                    {g.caption && <span className="mt-1 px-2 text-center text-[11px] text-slate-500">{g.caption}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Reviews</h2>
            {!vendor.reviews || vendor.reviews.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No reviews yet" description="Be the first to review this vendor." />
            ) : (
              <div className="space-y-4">
                {vendor.reviews.map((r) => (
                  <div key={r.id} className="border-b border-slate-50 pb-4 last:border-0 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <StarRating value={r.rating} size="sm" />
                      <span className="text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    </div>
                    {r.title && <p className="mt-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">{r.title}</p>}
                    {r.comment && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: rating distribution */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Rating breakdown</h2>
            <div className="mb-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{vendor.ratingAvg.toFixed(1)}</span>
              <div>
                <StarRating value={vendor.ratingAvg} size="sm" />
                <p className="text-xs text-slate-400">{vendor.reviewCount} review{vendor.reviewCount === 1 ? '' : 's'}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const c = dist[String(star)] ?? 0;
                const pct = totalRated > 0 ? (c / totalRated) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-slate-500">{star}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-slate-400">{c}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Status</h2>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={vendor.status} />
              {vendor.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}
            </div>
          </section>
        </div>
      </div>

      <BookingDialog vendor={vendor} open={showBooking} onClose={() => setShowBooking(false)} />
      <ReviewDialog vendor={vendor} open={showReview} onClose={() => setShowReview(false)} onSubmitted={load} />
    </div>
  );
}
