import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  /** When provided, stars become interactive. */
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
}

const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-6 h-6' };

export default function StarRating({ value, onChange, size = 'md', showValue = false, count }: StarRatingProps) {
  const interactive = typeof onChange === 'function';
  const rounded = Math.round(value);

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive ? star <= value : star <= rounded;
          const StarEl = (
            <Star
              className={cn(
                sizeMap[size],
                filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                interactive && 'transition-colors'
              )}
            />
          );
          return interactive ? (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              className="p-0.5 hover:scale-110 transition-transform"
              aria-label={`${star} star`}
            >
              {StarEl}
            </button>
          ) : (
            <span key={star} className="dark:opacity-90">{StarEl}</span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {value.toFixed(1)}
          {count != null && <span className="text-slate-400"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
