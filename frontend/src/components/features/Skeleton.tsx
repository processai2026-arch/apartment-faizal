import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Primitive: base animated pulse block
// ---------------------------------------------------------------------------
function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700',
        className,
      )}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard – a generic rounded card placeholder
// ---------------------------------------------------------------------------
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <SkeletonBlock className="mb-3 h-4 w-2/3" />
      <SkeletonBlock className="mb-2 h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTable – placeholder for a data table with N rows
// ---------------------------------------------------------------------------
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header row */}
      <div className="flex gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
        {[60, 120, 80, 100, 70].map((w, i) => (
          <SkeletonBlock key={i} className="h-3 rounded" style={{ width: w }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800"
        >
          {[60, 120, 80, 100, 70].map((w, colIdx) => (
            <SkeletonBlock
              key={colIdx}
              className="h-3 rounded"
              style={{ width: w, opacity: 1 - rowIdx * 0.08 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonText – placeholder for a paragraph / text block
// ---------------------------------------------------------------------------
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2'];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn('h-3', widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonKpi – row of KPI / stat-card placeholders
// ---------------------------------------------------------------------------
export function SkeletonKpi({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${Math.min(count, 4)}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Icon placeholder */}
          <SkeletonBlock className="mb-3 h-9 w-9 rounded-lg" />
          {/* Value */}
          <SkeletonBlock className="mb-2 h-7 w-16" />
          {/* Label */}
          <SkeletonBlock className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
