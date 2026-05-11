import { useState, useRef, useEffect } from 'react';
import { CheckCircle, QrCode, Phone, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Visitor } from '@/types';
import { toast } from 'sonner';
import QRCode from 'qrcode';

type Step = 1 | 2 | 3 | 4;

const MOCK_OTP = '123456';

export default function EntryVisitors() {
  const { addVisitor } = useAppStore();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<'otp' | 'qr'>('otp');
  const [form, setForm] = useState({ name: '', phone: '', apartmentNo: '', purpose: 'Personal Visit', vehicleNo: '', vehicleType: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [visitorRecord, setVisitorRecord] = useState<Visitor | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  useEffect(() => {
    if (step === 3 && mode === 'qr') {
      const data = JSON.stringify({ apartmentNo: form.apartmentNo, visitor: form.name, otp: MOCK_OTP });
      QRCode.toDataURL(data, { width: 200, margin: 2 }).then(setQrUrl).catch(console.error);
    }
  }, [step, mode, form]);

  const handleStep1 = () => {
    if (!form.name || !form.phone || !form.apartmentNo) { toast.error('Please fill all required fields'); return; }
    setResendTimer(60);
    setStep(2);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleVerify = () => {
    const entered = otp.join('');
    if (entered !== MOCK_OTP) { toast.error('Invalid OTP. Use 123456 for demo'); return; }
    const newVisitor: Visitor = {
      id: `V${Date.now()}`, name: form.name, phone: form.phone, apartmentNo: form.apartmentNo,
      purpose: form.purpose, category: 'Guest', vehicleNo: form.vehicleNo || undefined,
      status: 'Inside', entryTime: new Date().toISOString(), guardName: 'Guard on Duty', otp: MOCK_OTP
    };
    addVisitor(newVisitor);
    setVisitorRecord(newVisitor);
    setStep(4);
    toast.success('Visitor entry logged successfully!');
  };

  const resetForm = () => {
    setStep(1); setForm({ name: '', phone: '', apartmentNo: '', purpose: 'Personal Visit', vehicleNo: '', vehicleType: '' });
    setOtp(['', '', '', '', '', '']); setMode('otp'); setVisitorRecord(null);
  };

  const stepLabels = ['Visitor Details', 'OTP Verification', 'QR Alternative', 'Entry Pass'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 4].map((s, idx) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
            {idx < 2 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in">
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold font-[Outfit] mb-6">Visitor Details</h2>
            <div className="space-y-4">
              {[['Visitor Name *', 'name', 'text', 'e.g. John Doe'], ['Phone Number *', 'phone', 'tel', '+91 XXXXX XXXXX'], ['Apartment No. *', 'apartmentNo', 'text', 'e.g. A-101'], ['Purpose of Visit', 'purpose', 'text', 'Personal Visit'], ['Vehicle Number (Optional)', 'vehicleNo', 'text', 'e.g. KA-01-AB-1234']].map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</label>
                  <input type={type} placeholder={placeholder} value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors" />
                </div>
              ))}
            </div>
            <button onClick={handleStep1} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              Send OTP <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold font-[Outfit] mb-2">OTP Verification</h2>
            <p className="text-slate-500 text-sm mb-1">OTP sent to <span className="font-medium text-slate-800">{form.phone}</span></p>
            <p className="text-xs text-indigo-600 font-medium mb-6">Demo OTP: 123456</p>
            <div className="flex gap-3 justify-center mb-6">
              {otp.map((digit, idx) => (
                <input key={idx} ref={el => { otpRefs.current[idx] = el; }} type="text" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !digit && idx > 0) otpRefs.current[idx - 1]?.focus(); }}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
              ))}
            </div>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleVerify} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Verify OTP</button>
            </div>
            <button onClick={() => setMode('qr')} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mx-auto">
              <QrCode className="w-4 h-4" /> Switch to QR Mode
            </button>
            <p className="text-xs text-slate-400 mt-2">{resendTimer > 0 ? `Resend in ${resendTimer}s` : <button onClick={() => setResendTimer(60)} className="text-indigo-600 flex items-center gap-1 mx-auto"><RefreshCw className="w-3 h-3" /> Resend OTP</button>}</p>
          </div>
        )}

        {/* Step 3 QR */}
        {step === 3 && (
          <div className="text-center">
            <h2 className="text-xl font-semibold font-[Outfit] mb-2">QR Code Entry</h2>
            <p className="text-slate-500 text-sm mb-6">Visitor scans this QR code to verify entry</p>
            {qrUrl && <img src={qrUrl} alt="Visitor QR Code" className="mx-auto rounded-2xl border-4 border-slate-100 w-48 h-48 mb-6" />}
            <div className="flex gap-3">
              <button onClick={() => { setMode('otp'); setStep(2); }} className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50">Back to OTP</button>
              <button onClick={handleVerify} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">Confirm Entry</button>
            </div>
          </div>
        )}

        {/* Step 4 Success */}
        {step === 4 && visitorRecord && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold font-[Outfit] mb-2 text-green-700">Entry Successful!</h2>
            <div className="bg-slate-50 rounded-2xl p-5 text-left mt-6 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Entry Pass</h3>
              {[['Visitor', visitorRecord.name], ['Phone', visitorRecord.phone], ['Apartment', visitorRecord.apartmentNo], ['Purpose', visitorRecord.purpose], ['Entry Time', new Date(visitorRecord.entryTime).toLocaleTimeString()], ['Guard', visitorRecord.guardName || 'Guard on Duty']].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500 text-sm">{label}</span>
                  <span className="text-slate-900 text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={resetForm} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700">New Entry</button>
          </div>
        )}
      </div>
    </div>
  );
}
