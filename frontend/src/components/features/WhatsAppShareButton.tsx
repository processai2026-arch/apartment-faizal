import { useState } from 'react';
import { MessageCircle, Copy, Link, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  buildWhatsAppUrl,
  buildWhatsAppMessage,
  generateQRDataUrl,
  type WhatsAppSharePayload,
} from '@/lib/whatsapp';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppShareButtonProps {
  payload: WhatsAppSharePayload;
  className?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhatsAppShareButton({
  payload,
  className,
  size = 'default',
  variant = 'default',
}: WhatsAppShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const waUrl = buildWhatsAppUrl(payload);
  const messageText = buildWhatsAppMessage(payload);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleShareViaWhatsApp = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      toast.success('Message copied!');
    } catch {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(waUrl);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  const handleShowQR = async () => {
    if (qrVisible) {
      setQrVisible(false);
      return;
    }
    setQrVisible(true);
    if (!qrUrl) {
      setQrLoading(true);
      try {
        const url = await generateQRDataUrl(waUrl, 200);
        setQrUrl(url);
      } finally {
        setQrLoading(false);
      }
    }
  };

  // ── Trigger button styles ────────────────────────────────────────────────────

  const triggerClass = cn(
    'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
    size === 'sm'
      ? 'h-7 rounded-lg px-2.5 text-xs'
      : 'h-9 rounded-xl px-3 text-sm',
    variant === 'default' && 'bg-[#25D366] text-white hover:bg-[#1da851]',
    variant === 'outline' &&
      'border border-[#25D366] text-[#25D366] hover:bg-green-50 dark:hover:bg-green-950',
    variant === 'ghost' && 'text-[#25D366] hover:bg-green-50 dark:hover:bg-green-950',
    className
  );

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
          setQrVisible(false);
        }}
        className={triggerClass}
        title="Share via WhatsApp"
        aria-label="Share via WhatsApp"
      >
        <MessageCircle className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        {size !== 'sm' && <span>Share</span>}
      </button>

      {/* Dialog overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                    Share via WhatsApp
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    {payload.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message preview */}
            <div className="px-5 pt-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Message Preview
              </p>
              <textarea
                readOnly
                value={messageText}
                rows={6}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none font-mono leading-relaxed"
              />
            </div>

            {/* Action buttons */}
            <div className="px-5 pt-3 pb-4 grid grid-cols-2 gap-2">
              {/* Share via WhatsApp */}
              <button
                type="button"
                onClick={handleShareViaWhatsApp}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white hover:bg-[#1da851] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Open in WhatsApp
              </button>

              {/* Copy Message */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Message
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Link className="h-3.5 w-3.5" />
                Copy Link
              </button>

              {/* Show QR */}
              <button
                type="button"
                onClick={handleShowQR}
                className={cn(
                  'col-span-2 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-colors',
                  qrVisible
                    ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <QrCode className="h-3.5 w-3.5" />
                {qrVisible ? 'Hide QR Code' : 'Show QR Code'}
              </button>
            </div>

            {/* QR Code section */}
            {qrVisible && (
              <div className="px-5 pb-5">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-green-100 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    Scan to open WhatsApp
                  </p>
                  {qrLoading ? (
                    <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <QrCode className="h-8 w-8 text-slate-400" />
                    </div>
                  ) : qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="WhatsApp QR Code"
                      style={{ width: 200, height: 200 }}
                      className="rounded-lg"
                    />
                  ) : null}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-[200px]">
                    Point your phone camera at this code to open the pre-filled WhatsApp message.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
