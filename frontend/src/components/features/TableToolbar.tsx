import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TableToolbarProps {
  /** Left side: title text or a custom node (e.g. tabs). */
  title?: ReactNode;
  /** Small count/subtitle shown next to the title. */
  count?: ReactNode;
  /** Center/left controls, e.g. a SearchInput and filters. */
  filters?: ReactNode;
  /** Right-aligned actions, e.g. Add / Edit Columns / bulk actions. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard table toolbar. Replaces floating FABs by docking layout/column
 * controls and primary actions top-right, next to search.
 */
export default function TableToolbar({ title, count, filters, actions, className }: TableToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {title && (
          <div className="flex items-baseline gap-2">
            {typeof title === 'string'
              ? <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">{title}</h3>
              : title}
            {count !== undefined && count !== null && (
              <span className="text-xs text-slate-400">{count}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap lg:justify-end">
        {filters}
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
