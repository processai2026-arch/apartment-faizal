import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Car, User, Home, Camera, X, Phone, Building2, Layers } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Vehicle } from '@/types';

type Step = 'form' | 'success';

export default function ScanVehicleEntry() {
  const { addVehicle } = useAppStore();
  const [step, setStep] = useState<Step>('form');
  const [entry, setEntry] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    vehicleNo: '',
    vehicleType: '4-Wheeler' as Vehicle['vehicleType'],
    vehicleModel: '',
    ownerName: '',
    ownerPhone: '',
    block: '',
    floorNumber: '',
    companyName: '',
    parkingUserType: 'Visitor' as Vehicle['parkingUserType'],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stopCamera = () => {
    const stream = streamRef.current ?? (videoRef.current?.srcObject as MediaStream | null);
    stream?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrors(e => ({ ...e, camera: 'Camera is not supported in this browser' }));
      return;
    }
    try {
      stopCamera();
      setSnapshot(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      const isDenied = err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setErrors(e => ({
        ...e,
        camera: isDenied ? 'Camera permission was denied' : 'Unable to access camera',
      }));
    }
  };

  // Attach stream once the video element is mounted
  useEffect(() => {
    if (!cameraActive) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {
      setErrors(e => ({ ...e, camera: 'Could not start video preview. Try again.' }));
    });
  }, [cameraActive]);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setSnapshot(dataUrl);
        stopCamera();
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehicleNo.trim()) e.vehicleNo = 'Vehicle number is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const vehicle: Vehicle = {
        id: `VH${Date.now()}`,
        vehicleNo: form.vehicleNo.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        vehicleModel: form.vehicleModel.trim() || undefined,
        ownerName: form.ownerName.trim(),
        block: form.block.trim() || undefined,
        floorNumber: form.floorNumber.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        parkingUserType: form.parkingUserType,
        type: form.vehicleType,
        entryTime: new Date().toISOString(),
        status: 'Inside',
      };
      const saved = await addVehicle(vehicle) as Vehicle | undefined;
      try {
        const ch = new BroadcastChannel('apartmentos-scan-sync');
        ch.postMessage({ type: 'vehicle-entry', payload: saved || vehicle });
        ch.close();
      } catch { /* ignore */ }
      setEntry(saved || vehicle);
      setStep('success');
      setLoading(false);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Could not submit vehicle entry' });
      setLoading(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (step === 'success' && entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-bold font-[Outfit]">Vehicle Logged!</h2>
              <p className="text-indigo-100 text-sm mt-1">Entry recorded successfully</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                {/* Vehicle plate */}
                <div className="text-center mb-3">
                  <span className="bg-slate-900 text-white font-mono font-bold text-xl px-5 py-2 rounded-lg tracking-widest inline-block">
                    {entry.vehicleNo}
                  </span>
                </div>
                {entry.vehicleType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Type</span>
                    <span className="font-semibold text-slate-900">{entry.vehicleType}</span>
                  </div>
                )}
                {entry.vehicleModel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Model</span>
                    <span className="font-semibold text-slate-900">{entry.vehicleModel}</span>
                  </div>
                )}
                {entry.ownerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Owner</span>
                    <span className="font-semibold text-slate-900">{entry.ownerName}</span>
                  </div>
                )}
                {entry.block && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Block</span>
                    <span className="font-semibold text-slate-900">{entry.block}</span>
                  </div>
                )}
                {entry.floorNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Floor / Flat</span>
                    <span className="font-semibold text-slate-900">{entry.floorNumber}</span>
                  </div>
                )}
                {entry.companyName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Office / Flat</span>
                    <span className="font-semibold text-slate-900">{entry.companyName}</span>
                  </div>
                )}
                {entry.parkingUserType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">User Type</span>
                    <span className="font-semibold text-slate-900">{entry.parkingUserType}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
                  <span className="text-slate-500">Entry Time</span>
                  <div className="text-right">
                    <span className="font-bold text-indigo-600 text-base block">{formatTime(entry.entryTime)}</span>
                    <span className="text-xs text-slate-400">{formatDate(entry.entryTime)}</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400">
                Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form Screen ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
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

          {/* Live indicator */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 rounded-full px-4 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">Camera Active</span>
          </div>

          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-10 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-4">
            {/* Capture button */}
            <button
              onClick={takeSnapshot}
              className="w-20 h-20 rounded-full bg-white border-4 border-white flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-2xl"
              aria-label="Capture photo"
            >
              <Camera className="w-9 h-9 text-slate-800" />
            </button>
            <span className="text-white/70 text-xs">Tap to capture</span>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Vehicle Entry</h1>
          <p className="text-slate-400 text-sm mt-1">Register your vehicle at the gate</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Vehicle Number */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Vehicle Number *
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.vehicleNo}
                  onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value.toUpperCase() }))}
                  placeholder="e.g. KA-01-AB-1234"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.vehicleNo ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.vehicleNo && <p className="text-red-500 text-xs mt-1">{errors.vehicleNo}</p>}
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Vehicle Type *
              </label>
              <select
                value={form.vehicleType}
                onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value as Vehicle['vehicleType'] }))}
                className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {(['2-Wheeler', '4-Wheeler', 'Car', 'Bike', 'Other'] as Vehicle['vehicleType'][]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Model */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Vehicle Model
              </label>
              <input
                type="text"
                value={form.vehicleModel}
                onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))}
                placeholder="e.g. Honda Activa, Maruti Swift"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Owner / Driver Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                  placeholder="Full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.ownerName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
            </div>

            {/* Owner Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Owner Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Block */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Block
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.block}
                  onChange={e => setForm(f => ({ ...f, block: e.target.value }))}
                  placeholder="e.g. A, B, C"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Floor / Flat Number */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Floor / Flat Number
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.floorNumber}
                  onChange={e => setForm(f => ({ ...f, floorNumber: e.target.value }))}
                  placeholder="e.g. 3 / 301"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Company / Office / Flat Name
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="Which office or flat?"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Parking User Type */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Parking User Type
              </label>
              <select
                value={form.parkingUserType}
                onChange={e => setForm(f => ({ ...f, parkingUserType: e.target.value as Vehicle['parkingUserType'] }))}
                className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {(['Visitor', 'Employee', 'Vendor', 'Other'] as const).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Photo Capture */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Vehicle Photo
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                {snapshot ? (
                  <div className="space-y-3">
                    <img
                      src={snapshot}
                      alt="Vehicle"
                      className="w-full max-h-48 object-cover rounded-xl mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setSnapshot(null)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Camera className="w-4 h-4" />
                      Open Camera
                    </button>
                    <p className="text-xs text-slate-400">Captured image will appear here</p>
                  </div>
                )}
              </div>
              {errors.camera && <p className="text-red-500 text-xs mt-1">{errors.camera}</p>}
            </div>

            {/* Submit error */}
            {errors.submit && (
              <p className="text-red-500 text-xs text-center bg-red-50 py-2 px-3 rounded-lg">{errors.submit}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging Entry...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Log Vehicle Entry
                </>
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
