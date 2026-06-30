import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ExternalLink, Phone, MessageCircle, RefreshCcw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import { useBusinessAdStore } from '@/stores/useBusinessAdStore';
import type { BusinessAd } from '@/types';

function AdCard({ ad, onClick }: { ad: BusinessAd; onClick: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="relative flex h-32 items-center justify-center rounded-t-2xl bg-gradient-to-br from-violet-500 to-purple-600">
        {ad.featured && <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900"><Star className="inline h-2.5 w-2.5 fill-amber-900" /> Featured</span>}
        <Store className="h-12 w-12 text-white/60" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{ad.businessName}</h3>
        {ad.offer && <p className="mt-1 text-xs font-medium text-indigo-600 line-clamp-1">{ad.offer}</p>}
        {ad.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ad.description}</p>}
        <div className="mt-3 flex gap-2">
          {ad.phone && <a href={`tel:${ad.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"><Phone className="h-3 w-3" /> Call</a>}
          {ad.whatsapp && <a href={`https://wa.me/${ad.whatsapp.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"><MessageCircle className="h-3 w-3" /> WhatsApp</a>}
        </div>
      </div>
    </div>
  );
}

export default function BusinessMarketplace() {
  const navigate = useNavigate();
  const { ads, categories, loadAds, loadCategories } = useBusinessAdStore();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      loadAds({ search: search || undefined, category_id: categoryId || undefined }),
      loadCategories(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed')).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search, categoryId]); // eslint-disable-line

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Local Businesses</h1>
          <p className="text-sm text-slate-500">Discover services near you</p>
        </div>
        <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search businesses…" className="min-w-52" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategoryId('')} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', !categoryId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCategoryId(c.id)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', categoryId === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>
              {c.icon && <span className="mr-1">{c.icon}</span>}{c.name}
            </button>
          ))}
        </div>
      )}

      {ads.length === 0 ? (
        <EmptyState icon={Store} title="No businesses found" description="Try adjusting your search or category filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => <AdCard key={ad.id} ad={ad} onClick={() => navigate(`/tenant/business-ads/${ad.id}`)} />)}
        </div>
      )}
    </div>
  );
}
