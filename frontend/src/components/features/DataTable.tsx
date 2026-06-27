import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchKeys = [],
  searchPlaceholder = 'Search...',
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(item =>
      searchKeys.some(key => {
        const val = item[key];
        return String(val ?? '').toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getVal = (item: T, key: string) => {
    const keys = key.split('.');
    return keys.reduce((obj: unknown, k: string) => {
      if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
      return undefined;
    }, item);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-w-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map(col => (
                <th key={String(col.key)} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{col.label}</th>
              ))}
              {actions && <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-slate-400">No records found</td></tr>
            ) : paginated.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(item) : String(getVal(item, String(col.key)) ?? '—')}
                  </td>
                ))}
                {actions && <td className="px-4 py-3">{actions(item)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">{filtered.length} results • Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
