import { BadgeCheck, Heart, MapPin, Star, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import StarRating from '@/components/features/StarRating';
import type { MarketplaceVendor } from '@/types';

interface VendorCardProps {
  vendor: MarketplaceVendor;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: (vendor: MarketplaceVendor) => void;
}

export default function VendorCard({ vendor, isFavorite, onToggleFavorite, onClick }: VendorCardProps) {
  const initial = vendor.company?.charAt(0).toUpperCase() || vendor.name.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onClick?.(vendor)}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md cursor-pointer',
        'dark:border-slate-800 dark:bg-slate-900',
        vendor.isFeatured && 'ring-1 ring-amber-300'
      )}
    >
      {vendor.isFeatured && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow">
          <Star className="h-3 w-3 fill-white" /> Featured
        </span>
      )}

      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(vendor.id); }}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-300 transition-colors hover:bg-slate-50 hover:text-rose-500 dark:hover:bg-slate-800"
          aria-label="Toggle favorite"
        >
          <Heart className={cn('h-5 w-5', isFavorite && 'fill-rose-500 text-rose-500')} />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-lg font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</h3>
            {vendor.isVerified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-sky-500" />}
          </div>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{vendor.company}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {vendor.serviceType}
        </span>
        {vendor.serviceArea && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <MapPin className="h-3 w-3" /> {vendor.serviceArea}
          </span>
        )}
      </div>

      {vendor.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{vendor.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        <StarRating value={vendor.ratingAvg} size="sm" showValue count={vendor.reviewCount} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <CalendarCheck className="h-3.5 w-3.5" /> {vendor.bookingCount} booking{vendor.bookingCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}
