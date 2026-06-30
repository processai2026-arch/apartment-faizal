import { useState } from 'react';
import { X, Loader2, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useVendorMarketplaceStore } from '@/stores/useVendorMarketplaceStore';
import type { MarketplaceVendor } from '@/types';

interface BookingDialogProps {
  vendor: MarketplaceVendor;
  open: boolean;
  onClose: () => void;
  onBooked?: () => void;
}

export default function BookingDialog({ vendor, open, onClose, onBooked }: BookingDialogProps) {
  const { bookVendor } = useVendorMarketplaceStore();
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(''); setServiceId(''); setDescription(''); setScheduledFor('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please describe what you need'); return; }
    setSaving(true);
    try {
      await bookVendor({
        vendorId: vendor.id,
        serviceId: serviceId || undefined,
        title: title.trim(),
        description: description || undefined,
        scheduledFor: scheduledFor || undefined,
      });
      toast.success('Booking requested');
      reset();
      onBooked?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Book {vendor.name}</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">What do you need? *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., AC servicing for office"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>

              {vendor.services && vendor.services.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Service (optional)</label>
                  <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800">
                    <option value="">No specific service</option>
                    {vendor.services.filter((s) => s.isActive).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}{s.price != null ? ` — ₹${s.price.toLocaleString()}${s.unit ? `/${s.unit}` : ''}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Preferred date/time</label>
                <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Additional details</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Any specifics the vendor should know..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Booking…' : 'Request Booking'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
