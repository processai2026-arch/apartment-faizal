import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle, ShieldCheck, User, Phone, Home, FileText, Car, Send,
  ArrowLeft, Loader2, Camera, X, Users, Building2,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import { requireGateToken } from '@/lib/gateToken';
import type { Visitor } from '@/types';

type Step = 'phone' | 'otp' | 'form' | 'success';

export default function ScanVisitorEntry() {
  const { addVisitor } = useAppStore();
  const [step, setStep] = useState<Step>('phone');
  const [entry, setEntry] = useState<Visitor | null>(null);

  // Phone captured in step 1, carried into the form
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: '',
    block: '',
    floor: '',
    company: '',
    whomToMeet: '',
    purpose: 'Personal Visit',
    vehicleType: 'NA',
    vehicleNo: '',
    category: 'Guest' as Visitor['category'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // OTP state
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [videoReady, setVideoReady] = useState(false);

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const stopCamera = () => {
    const stream = streamRef.current ?? (videoRef.current?.srcObject as MediaStream | null);
    stream?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setVideoReady(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser or requires HTTPS.');
      return;
    }
    try {
      stopCamera();
      setSnapshot(null);
      setCameraError('');
      setVideoReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      const isDenied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setCameraError(
        isDenied
          ? 'Camera permission denied. Allow camera access in your browser.'
          : 'Could not start the camera. Check that no other app is using it.',
      );
    }
  };

  // Attach stream to video element once camera is active
  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    let cancelled = false;
    video.srcObject = stream;
    video.play().then(() => {
      if (!cancelled) setVideoReady(true);
    }).catch(() => {
      if (!cancelled) setCameraError('Could not start the video preview. Try again.');
    });

    return () => {
      cancelled = true;
    };
  }, [cameraActive]);

  // Stop camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSnapshot(dataUrl);
      stopCamera();
    }
  };

  // ── Validation for full form ─────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.whomToMeet.trim()) e.whomToMeet = 'Whom to meet is required';
    if (!form.purpose.trim()) e.purpose = 'Purpose is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 1: Send OTP from phone step ────────────────────────────────────────

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned || !/^\d{10}$/.test(cleaned)) {
      setPhoneError('Enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      requireGateToken('visitor-entry');
      await api.sendOtp(cleaned, 'visitor-entry');
      setStep('otp');
    } catch (error) {
      setPhoneError(error instanceof Error ? error.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP → go to form ─────────────────────────────────────────

  const handleVerifyOTP = async () => {
    if (enteredOtp.length !== 6) {
      setOtpError('Enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      await api.verifyOtp(phone.trim(), 'visitor-entry', enteredOtp);
      // Pre-fill phone in the full form, then advance to form step
      setForm(f => ({ ...f, phone: phone.trim() }));
      setStep('form');
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setOtpError('');
    try {
      await api.sendOtp(phone.trim(), 'visitor-entry');
      setEnteredOtp('');
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Submit the full form ─────────────────────────────────────────────

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const aptNo = [form.block, form.floor].filter(Boolean).join('-') || 'N/A';
      const visitor: Visitor = {
        id: `V${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: (form.gender as 'Male' | 'Female' | 'Other') || undefined,
        block: form.block.trim(),
        floorNumber: form.floor.trim(),
        companyName: form.company.trim(),
        whomToMeet: form.whomToMeet.trim(),
        reason: form.purpose.trim(),
        purpose: form.purpose.trim(),
        apartmentNo: aptNo,
        vehicleType:
          form.vehicleType && form.vehicleType !== 'NA'
            ? (form.vehicleType as 'Car' | 'Bike' | '2-Wheeler' | '4-Wheeler' | 'NA')
            : undefined,
        vehicleNo: form.vehicleNo.trim() || undefined,
        category: form.category,
        status: 'Inside',
        entryTime: new Date().toISOString(),
        guardName: 'Self Check-in (QR)',
        otp: 'verified',
        photoUrl: snapshot || undefined,
      };
      const saved = (await addVisitor(visitor)) as Visitor | undefined;

      // Broadcast to security dashboard open in other tabs
      try {
        const ch = new BroadcastChannel('apartmentos-scan-sync');
        ch.postMessage({ type: 'visitor-entry', payload: saved || visitor });
        ch.close();
      } catch { /* ignore */ }

      setEntry(saved || visitor);
      setStep('success');
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Could not submit entry' });
    } finally {
      setLoading(false);
    }
  };

  // ── Formatters ──────────────────────────────────────────────────────────────

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Input helper ─────────────────────────────────────────────────────────────

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
    }`;

  const labelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block';

  // ══════════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === 'success' && entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-bold font-[Outfit]">Entry Successful!</h2>
              <p className="text-green-100 text-sm mt-1">Your entry has been logged</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Visitor photo if captured */}
              {entry.photoUrl && (
                <div className="flex justify-center">
                  <img
                    src={entry.photoUrl}
                    alt={entry.name}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-green-100 shadow"
                  />
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Entry Pass</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Name</p>
                      <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                    </div>
                  </div>
                  {(entry.block || entry.floorNumber) && (
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Location</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {[entry.block && `Block ${entry.block}`, entry.floorNumber && `Floor ${entry.floorNumber}`]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {entry.whomToMeet && (
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Meeting</p>
                        <p className="text-sm font-semibold text-slate-900">{entry.whomToMeet}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Purpose</p>
                      <p className="text-sm font-semibold text-slate-900">{entry.purpose}</p>
                    </div>
                  </div>
                  {entry.vehicleNo && (
                    <div className="flex items-center gap-2.5">
                      <Car className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Vehicle</p>
                        <p className="text-sm font-semibold text-slate-900">{entry.vehicleNo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500 font-medium">Date</p>
                  <p className="text-sm font-bold text-indigo-900 mt-0.5">{formatDate(entry.entryTime)}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500 font-medium">Entry Time</p>
                  <p className="text-sm font-bold text-indigo-900 mt-0.5">{formatTime(entry.entryTime)}</p>
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Pass ID</p>
                <p className="text-lg font-bold font-mono text-slate-900 tracking-widest">{entry.id}</p>
              </div>

              <p className="text-center text-xs text-slate-400 leading-relaxed">
                Your visit has been recorded and security has been notified. Please check out when leaving.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // OTP SCREEN
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-[Outfit]">Verify OTP</h1>
            <p className="text-slate-400 text-sm mt-1">Enter the OTP sent to your phone</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">OTP sent to</p>
              <p className="text-lg font-bold text-green-900">+91 {phone}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                value={enteredOtp}
                onChange={e => {
                  setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                placeholder="• • • • • •"
                maxLength={6}
                className={`w-full px-4 py-4 border rounded-xl text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  otpError ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {otpError && <p className="text-red-500 text-xs mt-2 text-center">{otpError}</p>}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={enteredOtp.length !== 6 || loading}
              className="w-full bg-green-500 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-green-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Verify &amp; Continue</>
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep('phone'); setEnteredOtp(''); setOtpError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Number
              </button>
              <button
                onClick={handleResendOTP}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Resend OTP
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PHONE STEP (Step 1 — default)
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-[Outfit]">Visitor Check-In</h1>
            <p className="text-slate-400 text-sm mt-1">Enter your mobile number to get started</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-5">
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className={labelClass}>Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setPhoneError('');
                    }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    autoFocus
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      phoneError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
                    }`}
                  />
                </div>
                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send OTP</>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FULL FORM SCREEN (Step 3 — after OTP verified)
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-8 px-4">
      {/* Fullscreen Camera Overlay */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Close button */}
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center bg-white/20 hover:bg-white/35 active:bg-white/50 rounded-full text-white transition-colors"
            aria-label="Close camera"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Recording indicator */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 rounded-full px-4 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">Camera Active</span>
          </div>

          {/* Video stream */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-10 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-4">
            {cameraError && (
              <p className="text-red-400 text-sm font-medium px-4 py-1.5 rounded-full bg-black/40">
                {cameraError}
              </p>
            )}

            {/* Capture button */}
            <button
              onClick={takeSnapshot}
              disabled={!videoReady}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 ${
                videoReady
                  ? 'bg-white border-white hover:bg-slate-100 active:scale-95'
                  : 'bg-slate-700 border-slate-600 cursor-not-allowed'
              }`}
              aria-label="Capture photo"
            >
              <Camera className={`w-9 h-9 ${videoReady ? 'text-slate-800' : 'text-slate-500'}`} />
            </button>

            <span className={`text-xs ${videoReady ? 'text-white/70' : 'text-white/40'}`}>
              {videoReady ? 'Tap to capture' : 'Starting camera...'}
            </span>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-md mx-auto">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Visitor Details</h1>
          <p className="text-slate-400 text-sm mt-1">Phone verified — complete your entry details</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-5">
          <form onSubmit={handleSubmitForm} className="space-y-5">

            {/* ── Section: Personal Info ────────────────────────────────── */}
            <div className="space-y-1 pb-1 border-b border-slate-100">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Personal Info</p>
            </div>

            {/* Full Name */}
            <div>
              <label className={labelClass}>Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className={`${inputClass('name')} pl-10`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Phone — pre-filled, read-only */}
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* ── Section: Visiting Details ─────────────────────────────── */}
            <div className="space-y-1 pb-1 border-b border-slate-100 pt-2">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Visiting Details</p>
            </div>

            {/* Block */}
            <div>
              <label className={labelClass}>Block</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.block}
                  onChange={e => setForm(f => ({ ...f, block: e.target.value }))}
                  placeholder="e.g. A, B, C"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Floor Number */}
            <div>
              <label className={labelClass}>Floor Number</label>
              <input
                type="text"
                value={form.floor}
                onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                placeholder="e.g. 1, 2, Ground"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Company / Flat Name */}
            <div>
              <label className={labelClass}>Company / Flat Name</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="e.g. Flat 204, ABC Corp"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Whom to Meet */}
            <div>
              <label className={labelClass}>Whom to Meet *</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.whomToMeet}
                  onChange={e => setForm(f => ({ ...f, whomToMeet: e.target.value }))}
                  placeholder="Person you are visiting"
                  className={`${inputClass('whomToMeet')} pl-10`}
                />
              </div>
              {errors.whomToMeet && <p className="text-red-500 text-xs mt-1">{errors.whomToMeet}</p>}
            </div>

            {/* Purpose */}
            <div>
              <label className={labelClass}>Purpose of Visit *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  className={`${inputClass('purpose')} pl-10 appearance-none`}
                >
                  <option value="Personal Visit">Personal Visit</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Official">Official</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Visitor['category'] }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Guest">Guest</option>
                <option value="Delivery">Delivery</option>
                <option value="Worker">Worker</option>
                <option value="Vendor">Vendor</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* ── Section: Vehicle Info ─────────────────────────────────── */}
            <div className="space-y-1 pb-1 border-b border-slate-100 pt-2">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Vehicle Info</p>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className={labelClass}>Vehicle Type</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={form.vehicleType}
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value, vehicleNo: e.target.value === 'NA' ? '' : f.vehicleNo }))}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                >
                  <option value="NA">NA (No Vehicle)</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="2-Wheeler">2-Wheeler</option>
                  <option value="4-Wheeler">4-Wheeler</option>
                </select>
              </div>
            </div>

            {/* Vehicle Number — conditional */}
            {form.vehicleType && form.vehicleType !== 'NA' && (
              <div>
                <label className={labelClass}>Vehicle Number</label>
                <input
                  type="text"
                  value={form.vehicleNo}
                  onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value.toUpperCase() }))}
                  placeholder="e.g. KA-01-AB-1234"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wide"
                />
              </div>
            )}

            {/* ── Section: Photo ────────────────────────────────────────── */}
            <div className="space-y-1 pb-1 border-b border-slate-100 pt-2">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Visitor Photo</p>
            </div>

            {/* Camera capture */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
              {snapshot ? (
                <div className="space-y-3">
                  <img
                    src={snapshot}
                    alt="Visitor"
                    className="w-40 h-40 object-cover rounded-xl mx-auto shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setSnapshot(null)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-slate-400" />
                  </div>
                  {cameraError && (
                    <p className="text-red-500 text-xs">{cameraError}</p>
                  )}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    Open Camera
                  </button>
                  <p className="text-xs text-slate-400">Photo is optional but recommended</p>
                </div>
              )}
            </div>

            {/* ── Submit ────────────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Complete Check-In</>
              )}
            </button>

            {errors.submit && (
              <p className="text-red-500 text-xs text-center">{errors.submit}</p>
            )}
          </form>

          <p className="text-center text-xs text-slate-400">
            Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}
