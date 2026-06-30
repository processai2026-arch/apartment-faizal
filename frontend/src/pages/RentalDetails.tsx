import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Phone, Bed, Bath, Square, Calendar, Eye, Star, Home } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/features/StatusBadge';
import { useRentalStore } from '@/stores/useRentalStore';
import type { RentalListing } from '@/types';

export default function RentalDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadListing, toggleFavorite } = useRentalStore();
  const [listing, setListing] = useState<RentalListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadListing(id)
      .then(setListing)
      .catch(() => { toast.error('Listing not found'); navigate('/tenant/rental'); })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>;
  if (!listing) return null;

  const handleFavorite = async () => {
    try { const fav = await toggleFavorite(listing.id); setListing((l) => l ? { ...l, isFavorite: fav } : l); } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/tenant/rental')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </button>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500">
              <Home className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">{listing.title}</h1>
                {listing.featured && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700"><Star className="mr-0.5 inline h-3 w-3 fill-amber-500 text-amber-500" />Featured</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', listing.listingType === 'Sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}>{listing.listingType}</span>
                <span>{listing.propertyType}</span>
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {listing.viewCount} views</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {listing.favoriteCount} saved</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleFavorite} className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors', listing.isFavorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700')}>
              <Heart className={cn('h-4 w-4', listing.isFavorite && 'fill-rose-500 text-rose-500')} /> {listing.isFavorite ? 'Saved' : 'Save'}
            </button>
            <StatusBadge status={listing.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {listing.description && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Description</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{listing.description}</p>
            </section>
          )}

          {listing.history && listing.history.length > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Status Timeline</h2>
              <div className="space-y-3">
                {listing.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {h.fromStatus ? `${h.fromStatus} → ` : ''}{h.toStatus}
                        {h.changedByName && <span className="text-slate-400"> by {h.changedByName}</span>}
                      </p>
                      {h.comment && <p className="text-xs text-slate-500">{h.comment}</p>}
                      <p className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Details</h2>
            <dl className="space-y-3 text-sm">
              {listing.price != null && <div className="flex justify-between"><dt className="text-slate-500">Price</dt><dd className="font-bold text-indigo-600">₹{listing.price.toLocaleString('en-IN')}{listing.listingType === 'Rent' ? '/mo' : ''}</dd></div>}
              {listing.deposit != null && <div className="flex justify-between"><dt className="text-slate-500">Deposit</dt><dd className="font-medium text-slate-800 dark:text-slate-200">₹{listing.deposit.toLocaleString('en-IN')}</dd></div>}
              {listing.areaSqft != null && <div className="flex justify-between"><dt className="text-slate-500 flex items-center gap-1"><Square className="h-3.5 w-3.5" />Area</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{listing.areaSqft} sqft</dd></div>}
              {listing.bedrooms != null && <div className="flex justify-between"><dt className="text-slate-500 flex items-center gap-1"><Bed className="h-3.5 w-3.5" />Bedrooms</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{listing.bedrooms}</dd></div>}
              {listing.bathrooms != null && <div className="flex justify-between"><dt className="text-slate-500 flex items-center gap-1"><Bath className="h-3.5 w-3.5" />Bathrooms</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{listing.bathrooms}</dd></div>}
              {listing.furnishing && <div className="flex justify-between"><dt className="text-slate-500">Furnishing</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{listing.furnishing}</dd></div>}
              {listing.availableFrom && <div className="flex justify-between"><dt className="text-slate-500 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Available</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{new Date(listing.availableFrom).toLocaleDateString('en-IN')}</dd></div>}
            </dl>
          </section>

          {(listing.contactName || listing.contactPhone) && (
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-[Outfit] font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
              {listing.contactName && <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{listing.contactName}</p>}
              {listing.contactPhone && (
                <a href={`tel:${listing.contactPhone}`} className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                  <Phone className="h-4 w-4" /> {listing.contactPhone}
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
