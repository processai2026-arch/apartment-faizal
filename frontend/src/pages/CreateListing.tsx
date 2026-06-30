import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRentalStore } from '@/stores/useRentalStore';
import type { RentalListing } from '@/types';

const LISTING_TYPES = ['Rent', 'Sale'] as const;
const PROPERTY_TYPES = ['Office', 'Apartment', 'Shop', 'Parking'] as const;
const FURNISHING_OPTS = ['Unfurnished', 'Semi-furnished', 'Fully Furnished'];

export default function CreateListing() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { createListing, updateListing } = useRentalStore();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Partial<RentalListing>>({
    listingType: 'Rent',
    propertyType: 'Apartment',
    title: '',
    description: '',
    price: undefined,
    deposit: undefined,
    areaSqft: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    furnishing: '',
    availableFrom: '',
    contactName: '',
    contactPhone: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof RentalListing, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateListing(id, form);
        toast.success('Listing updated and resubmitted for approval');
      } else {
        await createListing(form);
        toast.success('Listing submitted for approval');
      }
      navigate('/tenant/rental');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/tenant/rental')} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-6 font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">{isEdit ? 'Edit Listing' : 'Post a Listing'}</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Listing Type</label>
              <select value={form.listingType} onChange={(e) => set('listingType', e.target.value as RentalListing['listingType'])}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {LISTING_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Property Type</label>
              <select value={form.propertyType} onChange={(e) => set('propertyType', e.target.value as RentalListing['propertyType'])}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required
              placeholder="e.g. 2BHK Apartment near Metro"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4}
              placeholder="Describe the property, amenities, location..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Price (₹)</label>
              <input type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)} placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Deposit (₹)</label>
              <input type="number" value={form.deposit ?? ''} onChange={(e) => set('deposit', e.target.value ? Number(e.target.value) : undefined)} placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Area (sqft)</label>
              <input type="number" value={form.areaSqft ?? ''} onChange={(e) => set('areaSqft', e.target.value ? Number(e.target.value) : undefined)} placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bedrooms</label>
              <input type="number" value={form.bedrooms ?? ''} onChange={(e) => set('bedrooms', e.target.value ? Number(e.target.value) : undefined)} placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bathrooms</label>
              <input type="number" value={form.bathrooms ?? ''} onChange={(e) => set('bathrooms', e.target.value ? Number(e.target.value) : undefined)} placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Furnishing</label>
              <select value={form.furnishing ?? ''} onChange={(e) => set('furnishing', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">Select</option>
                {FURNISHING_OPTS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Available From</label>
              <input type="date" value={form.availableFrom ?? ''} onChange={(e) => set('availableFrom', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Name</label>
              <input type="text" value={form.contactName ?? ''} onChange={(e) => set('contactName', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input type="tel" value={form.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/tenant/rental')} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : isEdit ? 'Update Listing' : 'Submit Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
