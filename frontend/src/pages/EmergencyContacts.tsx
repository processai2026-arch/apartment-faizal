import { useState, useEffect } from 'react';
import { Phone, Pin, RefreshCcw, ShieldAlert, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import { useEmergencyStore } from '@/stores/useEmergencyStore';

const CATEGORY_COLORS: Record<string, string> = {
  Police: 'bg-blue-100 text-blue-700',
  Fire: 'bg-orange-100 text-orange-700',
  Hospital: 'bg-rose-100 text-rose-700',
  Ambulance: 'bg-red-100 text-red-700',
  Electrician: 'bg-yellow-100 text-yellow-700',
  Plumber: 'bg-cyan-100 text-cyan-700',
  Security: 'bg-slate-100 text-slate-700',
  'Apartment Office': 'bg-indigo-100 text-indigo-700',
};

export default function EmergencyContacts() {
  const { contacts, loadContacts } = useEmergencyStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    loadContacts({ search: search || undefined, category: category || undefined })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search, category]); // eslint-disable-line

  const pinned = contacts.filter((c) => c.isPinned);
  const rest = contacts.filter((c) => !c.isPinned);
  const categories = [...new Set(contacts.map((c) => c.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Emergency Contacts</h1>
          <p className="text-sm text-slate-500">Quick access to important numbers</p>
        </div>
        <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search contacts…" /></div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {contacts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No emergency contacts" description="Contact admin to add emergency contacts." />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Pin className="h-4 w-4 text-rose-500" /> Pinned
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pinned.map((c) => (
                  <div key={c.id} className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-4 dark:border-rose-800/40 dark:bg-rose-900/10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                        <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', CATEGORY_COLORS[c.category] ?? 'bg-slate-100 text-slate-600')}>{c.category}</span>
                        {c.available24h && <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><Clock className="h-2.5 w-2.5" /> 24h</span>}
                      </div>
                    </div>
                    <a href={`tel:${c.phone}`} className="mt-3 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700">
                      <Phone className="h-4 w-4" /> {c.phone}
                    </a>
                    {c.alternatePhone && <a href={`tel:${c.alternatePhone}`} className="mt-2 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                      <Phone className="h-4 w-4" /> {c.alternatePhone}
                    </a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Other Contacts</h2>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rest.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">{c.name}</h3>
                        <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium', CATEGORY_COLORS[c.category] ?? 'bg-slate-100 text-slate-600')}>{c.category}</span>
                        {c.available24h && <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><Clock className="h-2.5 w-2.5" /> 24h</span>}
                      </div>
                    </div>
                    <a href={`tel:${c.phone}`} className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
                      <Phone className="h-4 w-4" /> {c.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
