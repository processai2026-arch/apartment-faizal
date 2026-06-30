import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce in ms before calling onChange. Default 250. Pass 0 to disable. */
  debounceMs?: number;
  className?: string;
}

/**
 * Unified search input: consistent size/styling, debounced onChange,
 * and a clear (×) button. Local state keeps typing snappy.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 250,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<number | null>(null);

  // Keep local state in sync when the parent resets the value externally.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const emit = (next: string) => {
    setLocal(next);
    if (debounceMs <= 0) {
      onChange(next);
      return;
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(next), debounceMs);
  };

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setLocal('');
    onChange('');
  };

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={(e) => emit(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
      />
      {local && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
