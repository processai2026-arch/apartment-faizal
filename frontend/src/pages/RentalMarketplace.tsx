import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Heart, Plus, RefreshCcw, Star, MapPin, Bed, Bath, Square, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import StatusBadge from '@/components/features/StatusBadge';
import { useRentalStore } from '@/stores/useRentalStore';
import type { RentalListing } from '@/types';

type Tab = 'browse' | 'my-listings' | 'favorites';

function ListingCard({ listing, onView, onFavorite }: { listing: RentalListing; onView: () => void; onFavorite: (e: React.MouseEvent) => void }) {
  return (
    <div onClick={onView} className="cursor-pointer rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative flex h-36 items-center justify-center rounded-t-2xl bg-gradient-to-br from-indigo-500 to-sky-500">
        {listing.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">Featured</span>
        )}
        <button onClick={onFavorite} className={cn('absolute right-3 top-3 rounded-full p-1.5 transition-colors', listing.isFavorite ? 'bg-rose-100 text-rose-500' : 'bg-white/80 text-slate-400 hover:text-rose-500')}>
          <Heart className={cn('h-4 w-4', listing.isFavorite && 'fill-rose-500')} />
        </button>
        <Home className="h-12 w-12 text-white/60" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-slate-900 dark:text-slate-100">{listing.title}</h3>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', listing.listingType === 'Sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}>{listing.listingType}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{listing.propertyType}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          {listing.bedrooms != null && <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {listing.bedrooms} Bed</span>}
          {listing.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {listing.bathrooms} Bath</span>}
          {listing.areaSqft != null && <span className="flex items-center gap-1"><Square className="h-3 w-3" /> {listing.areaSqft} sqft</span>}
        </div>
        <div className="mt-3 flex items-center justify-between">
          {listing.price != null ? (
            <span className="text-lg font-bold text-indigo-600">₹{listing.price.toLocaleString('en-IN')}{listing.listingType === 'Rent' ? '/mo' : ''}</span>
          ) : <span className="text-sm text-slate-400">Price on request</span>}
          <StatusBadge status={listing.status} size="sm" />
        </div>
      </div>
    </div>
  );
}

export default function RentalMarketplace() {
  const navigate = useNavigate();
  const { listings, myListings, favorites, loadListings, loadMyListings, loadFavorites, toggleFavorite } = useRentalStore();

  const [tab, setTab] = useState<Tab>('browse');
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      loadListings({ search: search || undefined, listing_type: listingType || undefined, property_type: propertyType || undefined, max_price: maxPrice || undefined }),
      loadMyListings(),
      loadFavorites(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search, listingType, propertyType, maxPrice]); // eslint-disable-line

  const handleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try { await toggleFavorite(id); } catch { toast.error('Failed to update favorite'); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'browse', label: 'Browse' },
    { id: 'my-listings', label: 'My Listings' },
    { id: 'favorites', label: 'Saved' },
  ];

  const displayItems = tab === 'browse' ? listings : tab === 'my-listings' ? myListings : favorites;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Rental Marketplace</h1>
          <p className="text-sm text-slate-500">Find offices, apartments, and more</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => navigate('/tenant/rental/create')} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Post Listing
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === t.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Filters (browse tab only) */}
      {tab === 'browse' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search listings…" /></div>
            <button onClick={() => setShowFilters(!showFilters)} className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors', showFilters ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300')}>
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Types</option>
                <option value="Rent">Rent</option>
                <option value="Sale">Sale</option>
              </select>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Properties</option>
                {['Office', 'Apartment', 'Shop', 'Parking'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="relative">
                <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                {maxPrice && <button onClick={() => setMaxPrice('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {displayItems.length === 0 ? (
        <EmptyState icon={Home} title={tab === 'my-listings' ? 'No listings yet' : tab === 'favorites' ? 'No saved listings' : 'No listings found'} description={tab === 'my-listings' ? 'Post your first listing to get started.' : 'Try adjusting your filters.'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((listing) => (
            <ListingCard key={listing.id} listing={listing}
              onView={() => navigate(`/tenant/rental/${listing.id}`)}
              onFavorite={(e) => handleFavorite(e, listing.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
