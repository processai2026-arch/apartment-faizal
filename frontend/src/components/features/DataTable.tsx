import { useState, useMemo, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchInput from './SearchInput';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  actions?: (item: T) => React.ReactNode;
  /** Unique row id accessor for selection/keys. Defaults to item.id. */
  rowId?: (item: T) => string;
  /** Enable row selection checkboxes (drives bulk actions). */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Zebra striping for rows. */
  zebra?: boolean;
  /** Custom node rendered above the table (toolbar / tabs / bulk bar). */
  toolbar?: ReactNode;
  /** Hide the built-in search box (e.g. when search lives in a toolbar). */
  hideSearch?: boolean;
  /** Empty-state shown when there are no rows. */
  empty?: ReactNode;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  actions,
  rowId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  zebra = false,
  toolbar,
  hideSearch = false,
  empty,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const getId = (item: T) => (rowId ? rowId(item) : String((item as { id?: unknown }).id ?? ''));

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(item =>
      searchKeys.some(key => String(item[key] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getVal = (item: T, key: string) => {
    return key.split('.').reduce((obj: unknown, k: string) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
      return undefined;
    }, item);
  };

  const pageIds = paginated.map(getId);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allPageSelected
      ? selectedIds.filter(id => !pageIds.includes(id))
      : Array.from(new Set([...selectedIds, ...pageIds])));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]);
  };

  const colSpan = columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {toolbar && <div className="p-4 border-b border-slate-100">{toolbar}</div>}
      {!hideSearch && (
        <div className="p-4 border-b border-slate-100">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map(col => (
                <th key={String(col.key)} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{col.label}</th>
              ))}
              {actions && <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-0">
                  {empty ?? <EmptyState title="No records found" description="Try adjusting your search or filters." />}
                </td>
              </tr>
            ) : paginated.map((item, idx) => {
              const id = getId(item);
              const selected = selectedIds.includes(id);
              return (
                <tr
                  key={id || idx}
                  className={cn(
                    'transition-colors hover:bg-indigo-50/40',
                    zebra && idx % 2 === 1 && 'bg-slate-50/40',
                    selected && 'bg-indigo-50/60'
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOne(id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={String(col.key)} className={cn('px-4 py-3 text-slate-700', col.className ?? 'whitespace-nowrap')}>
                      {col.render ? col.render(item) : String(getVal(item, String(col.key)) ?? '—')}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">{actions(item)}</div></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">{filtered.length} results • Page {safePage} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable avatar + name/subtitle cell, e.g. "Name" over "role • dept". */
export function NameCell({ name, subtitle, color = 'indigo' }: { name: string; subtitle?: string; color?: 'indigo' | 'green' | 'amber' | 'violet' | 'blue' }) {
  const ring: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    violet: 'bg-violet-100 text-violet-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', ring[color])}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-slate-900 truncate">{name}</p>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
