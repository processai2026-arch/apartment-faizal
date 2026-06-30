import { useState, useEffect } from 'react';
import { Store, Plus, Trash2, RefreshCcw, Tag, BarChart3, MousePointerClick, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { useBusinessAdStore } from '@/stores/useBusinessAdStore';
import type { BusinessAd, BusinessCategory } from '@/types';

type Tab = 'ads' | 'categories' | 'dashboard';

export default function AdminBusinessAds() {
  const { ads: adminAds, categories, dashboard, loadAdminAds, loadCategories, createAd, updateAd, deleteAd, setStatus, loadDashboard, createCategory, updateCategory, deleteCategory } = useBusinessAdStore();
  const [tab, setTab] = useState<Tab>('ads');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [adForm, setAdForm] = useState<Partial<BusinessAd> | null>(null);
  const [catForm, setCatForm] = useState<Partial<BusinessCategory> | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([loadAdminAds({ search: search || undefined }), loadCategories(), loadDashboard()])
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search]); // eslint-disable-line

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm) return;
    setSaving(true);
    try {
      if (adForm.id) { await updateAd(adForm.id, adForm); toast.success('Ad updated'); }
      else { await createAd(adForm); toast.success('Ad created'); }
      setAdForm(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm) return;
    setSaving(true);
    try {
      if (catForm.id) { await updateCategory(catForm.id, catForm); toast.success('Category updated'); }
      else { await createCategory(catForm); toast.success('Category created'); }
      setCatForm(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try { await deleteAd(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await deleteCategory(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const stats = dashboard?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Business Ads</h1>
          <p className="text-sm text-slate-500">Manage local business advertisements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          {tab === 'ads' && <button onClick={() => setAdForm({})} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add Ad</button>}
          {tab === 'categories' && <button onClick={() => setCatForm({})} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add Category</button>}
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['ads', 'categories', 'dashboard'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {([['Total Ads', stats.total, Store, 'bg-indigo-500'], ['Active', stats.active, Store, 'bg-emerald-500'], ['Total Views', stats.totalViews, Eye, 'bg-sky-500'], ['Total Clicks', stats.totalClicks, MousePointerClick, 'bg-violet-500']] as const).map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', color)}><Icon className="h-5 w-5 text-white" /></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value.toLocaleString()}</p>
              <p className="mt-0.5 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'ads' && (
        <div className="space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search ads…" />
          {adminAds.length === 0 ? <EmptyState icon={Store} title="No ads yet" description="Add the first business ad." /> : (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3 hidden md:table-cell"><Eye className="h-3.5 w-3.5 inline" /> / <MousePointerClick className="h-3.5 w-3.5 inline" /></th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {adminAds.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{ad.businessName}</p>
                        {ad.offer && <p className="text-xs text-indigo-600 line-clamp-1">{ad.offer}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell"><StatusBadge status={ad.status} size="sm" /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{ad.viewCount} / {ad.clickCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => setAdForm(ad)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700">
                            <Store className="h-3.5 w-3.5" />
                          </button>
                          {ad.status !== 'Active' && <button onClick={() => setStatus(ad.id, 'Active').then(() => toast.success('Activated'))} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 text-xs font-medium px-2">Activate</button>}
                          <button onClick={() => handleDeleteAd(ad.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 ? <EmptyState icon={Tag} title="No categories" description="Add your first category." /> :
            categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  {c.icon && <span className="text-2xl">{c.icon}</span>}
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setCatForm(c)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700"><Tag className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDeleteCat(c.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Ad Form Modal */}
      {adForm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{adForm.id ? 'Edit Ad' : 'New Business Ad'}</h3>
            <form onSubmit={handleSaveAd} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Business Name *</label>
                <input required value={adForm.businessName ?? ''} onChange={(e) => setAdForm((f) => f && { ...f, businessName: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select value={adForm.categoryId ?? ''} onChange={(e) => setAdForm((f) => f && { ...f, categoryId: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea rows={3} value={adForm.description ?? ''} onChange={(e) => setAdForm((f) => f && { ...f, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Offer / Tagline</label>
                <input value={adForm.offer ?? ''} onChange={(e) => setAdForm((f) => f && { ...f, offer: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input type="tel" value={adForm.phone ?? ''} onChange={(e) => setAdForm((f) => f && { ...f, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
                  <input type="tel" value={adForm.whatsapp ?? ''} onChange={(e) => setAdForm((f) => f && { ...f, whatsapp: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAdForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {catForm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{catForm.id ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSaveCat} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                <input required value={catForm.name ?? ''} onChange={(e) => setCatForm((f) => f && { ...f, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Slug *</label>
                <input required value={catForm.slug ?? ''} onChange={(e) => setCatForm((f) => f && { ...f, slug: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Icon (emoji)</label>
                <input value={catForm.icon ?? ''} onChange={(e) => setCatForm((f) => f && { ...f, icon: e.target.value })} placeholder="e.g. 🍕" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCatForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
