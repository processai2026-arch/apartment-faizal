import { useState } from 'react';
import { X, Loader2, MessageSquare, ImagePlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useVendorMarketplaceStore } from '@/stores/useVendorMarketplaceStore';
import StarRating from '@/components/features/StarRating';
import type { MarketplaceVendor } from '@/types';

interface ReviewDialogProps {
  vendor: MarketplaceVendor;
  bookingId?: string;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function ReviewDialog({ vendor, bookingId, open, onClose, onSubmitted }: ReviewDialogProps) {
  const { submitReview } = useVendorMarketplaceStore();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setRating(5); setTitle(''); setComment(''); setImageFile(null); setImagePreview(null);
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) { toast.error('Please select a rating'); return; }
    setSaving(true);
    try {
      let attachmentId: string | undefined;
      if (imageFile) {
        const uploaded = await api.uploads.create(imageFile, 'reviews');
        attachmentId = String(uploaded.id);
      }
      await submitReview({
        vendorId: vendor.id,
        bookingId,
        rating,
        title: title || undefined,
        comment: comment || undefined,
        attachmentId,
      });
      toast.success('Review submitted for moderation');
      reset();
      onSubmitted?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit review');
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
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <h3 className="font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Review {vendor.name}</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Your rating</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Title (optional)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Review</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Tell others about the service..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Photo (optional)</label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Review" className="h-24 w-24 rounded-xl object-cover" />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow hover:bg-red-600">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700">
                    <ImagePlus className="h-4 w-4" /> Add photo
                    <input type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
