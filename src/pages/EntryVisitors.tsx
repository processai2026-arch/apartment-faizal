import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Phone, Camera, Clock, Building2, Users, Car } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Visitor } from '@/types';
import { toast } from 'sonner';

const MOCK_OTP = '123456';

export default function EntryVisitors() {
  const { addVisitor, offices } = useAppStore();
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [form, setForm] = useState({
    phone: '',
    name: '',
    gender: '',
    address: '',
    city: '',
    pincode: '',
    vehicleType: '',
    vehicleNo: '',
    block: '',
    floor: '',
    company: '',
    whomToMeet: '',
    reason: '',
  });

  // Get unique blocks from offices
  const blocks = [...new Set(offices.map(o => o.block))].sort();
  
  // Get floors for selected block
  const floors = offices
    .filter(o => o.block === form.block)
    .map(o => o.floorNumber)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => parseInt(a) - parseInt(b));

  // Get companies for selected block and floor
  const companies = offices
    .filter(o => o.block === form.block && o.floorNumber === form.floor)
    .map(o => o.companyName)
    .filter(Boolean);

  const handleSendOTP = () => {
    if (!form.phone || form.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setOtpSent(true);
    toast.success('OTP sent successfully! Use 123456 for demo');
  };

  const handleVerifyOTP = () => {
    if (otp !== MOCK_OTP) {
      toast.error('Invalid OTP. Use 123456 for demo');
      return;
    }
    setOtpVerified(true);
    toast.success('OTP verified successfully!');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      toast.error('Unable to access camera');
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setSnapshot(dataUrl);
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setCameraActive(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.block || !form.floor) {
      toast.error('Please fill all required fields');
      return;
    }

    const newVisitor: Visitor = {
      id: `V${Date.now()}`,
      name: form.name,
      phone: form.phone,
      gender: form.gender as 'Male' | 'Female' | 'Other' | undefined,
      address: form.address,
      city: form.city,
      pincode: form.pincode,
      block: form.block,
      floorNumber: form.floor,
      companyName: form.company,
      whomToMeet: form.whomToMeet,
      reason: form.reason,
      vehicleNo: form.vehicleNo || undefined,
      vehicleType: (form.vehicleType as 'Car' | 'Bike' | '2-Wheeler' | '4-Wheeler' | 'NA') || undefined,
      category: 'Guest',
      status: 'Inside',
      entryTime: new Date().toISOString(),
      guardName: 'Guard on Duty',
      otp: MOCK_OTP,
      photoUrl: snapshot || undefined,
    };

    addVisitor(newVisitor);
    toast.success('Visitor entry logged successfully!');
    
    // Reset form
    setForm({
      phone: '', name: '', gender: '', address: '', city: '', pincode: '',
      vehicleType: '', vehicleNo: '', block: '', floor: '', company: '',
      whomToMeet: '', reason: '',
    });
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setSnapshot(null);
  };

  const currentTime = new Date().toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Visitor's Entry Form</h2>
          <p className="text-sm text-slate-500">Please fill up the details below</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Visitor Details */}
            <div className="space-y-5">
              {/* Phone with OTP */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visitor's Contact Number *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    disabled={otpVerified}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>
                {!otpSent ? (
                  <button
                    onClick={handleSendOTP}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send OTP
                  </button>
                ) : !otpVerified ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleVerifyOTP}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> OTP Verified
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visitor's Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Choose...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visitor's Address</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">City</label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Pincode</label>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Vehicle Type</label>
                <select
                  value={form.vehicleType}
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Choose...</option>
                  <option value="2-Wheeler">2-Wheeler</option>
                  <option value="4-Wheeler">4-Wheeler</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            {/* Middle Column - Office Details */}
            <div className="space-y-5">
              {/* Check In Time */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Check In Time</label>
                <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {currentTime}
                </div>
              </div>

              {/* Block */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Block *</label>
                <select
                  value={form.block}
                  onChange={e => setForm(f => ({ ...f, block: e.target.value, floor: '', company: '' }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Choose...</option>
                  {blocks.map(block => (
                    <option key={block} value={block}>Block {block}</option>
                  ))}
                </select>
              </div>

              {/* Floor */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Floor *</label>
                <select
                  value={form.floor}
                  onChange={e => setForm(f => ({ ...f, floor: e.target.value, company: '' }))}
                  disabled={!form.block}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100"
                >
                  <option value="">Choose...</option>
                  {floors.map(floor => (
                    <option key={floor} value={floor}>Floor {floor}</option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Company</label>
                <select
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  disabled={!form.floor}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100"
                >
                  <option value="">Choose...</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              {/* Whom to Meet */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Whom to Meet</label>
                <input
                  type="text"
                  placeholder="Enter person name"
                  value={form.whomToMeet}
                  onChange={e => setForm(f => ({ ...f, whomToMeet: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason</label>
                <input
                  type="text"
                  placeholder="Enter reason for visit"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Vehicle Number</label>
                <input
                  type="text"
                  placeholder="e.g. KA-01-AB-1234"
                  value={form.vehicleNo}
                  onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Right Column - Snapshot */}
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visitor Photo</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                  {snapshot ? (
                    <div className="space-y-3">
                      <img src={snapshot} alt="Visitor" className="w-48 h-48 object-cover rounded-xl mx-auto" />
                      <button
                        onClick={() => setSnapshot(null)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : cameraActive ? (
                    <div className="space-y-3">
                      <video ref={videoRef} autoPlay className="w-48 h-48 object-cover rounded-xl mx-auto" />
                      <button
                        onClick={takeSnapshot}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Camera className="w-4 h-4" /> Capture
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 py-8">
                      <Camera className="w-12 h-12 text-slate-300 mx-auto" />
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Take Snapshot
                      </button>
                      <p className="text-xs text-slate-400">Your captured image will appear here...</p>
                    </div>
                  )}
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-lg font-medium rounded-xl hover:from-blue-500 hover:to-blue-700 transition-all shadow-lg"
            >
              Submit Visitor Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}