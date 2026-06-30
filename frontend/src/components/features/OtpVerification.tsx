import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type OtpPurpose = 'visitor-entry' | 'visitor-checkout' | 'login';

interface OtpVerificationProps {
  phone: string;
  purpose: OtpPurpose;
  verified: boolean;
  onVerified: () => void;
  /** Optional: called whenever the phone should be re-validated before sending. Return an error string to block. */
  validatePhone?: () => string | null;
  disabled?: boolean;
}

interface OtpSendResponse {
  expiresInSeconds?: number;
  resendAvailableInSeconds?: number;
}

const DEFAULT_RESEND_COOLDOWN = 30;

/**
 * Production OTP verification: sends a real OTP via the backend, shows a countdown
 * timer until expiry, a resend button gated by a cooldown, inline errors, and a
 * success state. No hardcoded codes.
 */
export default function OtpVerification({ phone, purpose, verified, onVerified, validatePhone, disabled }: OtpVerificationProps) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0); // seconds until OTP expiry
  const [resendIn, setResendIn] = useState(0); // seconds until resend allowed
  const tickRef = useRef<number | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  // Single 1s interval drives both countdowns.
  useEffect(() => {
    if (!sent || verified) {
      clearTick();
      return;
    }
    clearTick();
    tickRef.current = window.setInterval(() => {
      setExpiresIn((v) => (v > 0 ? v - 1 : 0));
      setResendIn((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return clearTick;
  }, [sent, verified, clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  const handleSend = async () => {
    setError(null);
    const validationError = validatePhone?.();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number first');
      return;
    }
    setSending(true);
    try {
      const res = (await api.sendOtp(phone, purpose)) as OtpSendResponse;
      setSent(true);
      setCode('');
      setExpiresIn(res.expiresInSeconds ?? 300);
      setResendIn(res.resendAvailableInSeconds ?? DEFAULT_RESEND_COOLDOWN);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      await api.verifyOtp(phone, purpose, code);
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
        <CheckCircle className="w-4 h-4" /> Phone verified
      </div>
    );
  }

  if (!sent) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || sending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {sending ? 'Sending…' : 'Send OTP'}
        </button>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>
        )}
      </div>
    );
  }

  const expired = expiresIn <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
          placeholder="Enter 6-digit OTP"
          disabled={verifying || expired}
          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || expired || code.length !== 6}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={cn('text-slate-500', expired && 'text-red-600')}>
          {expired ? 'Code expired — please resend' : `Code expires in ${formatTime(expiresIn)}`}
        </span>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || resendIn > 0}
          className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <RefreshCcw className={cn('w-3.5 h-3.5', sending && 'animate-spin')} />
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
