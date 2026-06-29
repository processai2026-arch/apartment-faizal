import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Phone, Camera, Clock, Building2, Users, Car, Eye, EyeOff, Edit3, Save, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import type { Visitor } from '@/types';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { checkVisitorFace, type VisitorFaceCheck } from '@/lib/visitorFaceDetection';

const MOCK_OTP = '123456';
const INITIAL_FACE_CHECK: VisitorFaceCheck = {
  canCapture: false,
  status: 'loading',
  message: 'Start camera to verify visitor face.',
};

export default function EntryVisitors() {
  const { addVisitor, offices } = useAppStore();
  const { settings, getVisibleColumns, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceCheckIntervalRef = useRef<number | null>(null);
  const faceCheckBusyRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceCheck, setFaceCheck] = useState<VisitorFaceCheck>(INITIAL_FACE_CHECK);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localFields, setLocalFields] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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

  const pageSettings = settings.entryVisitors;

  // Initialize local fields when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setLocalFields([...pageSettings.columns].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.columns]);

  const visibleFields = isEditMode 
    ? localFields 
    : getVisibleColumns('entryVisitors');

  // Field visibility helper - default to true if no settings exist
  const isFieldVisible = (fieldId: string) => {
    if (isEditMode) {
      return localFields.find(f => f.id === fieldId)?.visible ?? true;
    }
    // If no columns are configured yet, show all fields by default
    if (pageSettings.columns.length === 0) {
      return true;
    }
    // Check if field exists in settings, if not default to visible
    const fieldConfig = pageSettings.columns.find(f => f.id === fieldId);
    if (!fieldConfig) {
      return true;
    }
    return fieldConfig.visible;
  };

  // Handle field visibility toggle
  const handleFieldVisibilityToggle = (fieldId: string) => {
    setLocalFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, visible: !field.visible } : field
    ));
    setHasChanges(true);
  };

  // Handle field reorder
  const handleFieldReorder = (newOrder: ColumnConfig[]) => {
    const updatedFields = newOrder.map((field, index) => ({
      ...field,
      order: index,
    }));
    setLocalFields(updatedFields);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    updateColumnOrder('entryVisitors', localFields);
    setIsEditMode(false);
    setHasChanges(false);
    toast.success('Form field settings saved!');
  };

  // Cancel edit mode
  const handleCancel = () => {
    setIsEditMode(false);
    setHasChanges(false);
  };

  // Reset to default
  const handleReset = () => {
    resetPageSettings('entryVisitors');
    setLocalFields([...settings.entryVisitors.columns].sort((a, b) => a.order - b.order));
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

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

  const stopCamera = () => {
    if (faceCheckIntervalRef.current !== null) {
      window.clearInterval(faceCheckIntervalRef.current);
      faceCheckIntervalRef.current = null;
    }
    faceCheckBusyRef.current = false;

    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(track => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const runFaceCheck = async () => {
    if (faceCheckBusyRef.current || !videoRef.current) {
      return;
    }

    faceCheckBusyRef.current = true;
    try {
      setFaceCheck(await checkVisitorFace(videoRef.current));
    } catch {
      setFaceCheck({
        canCapture: false,
        status: 'error',
        message: 'Face verification failed. Try restarting the camera.',
      });
    } finally {
      faceCheckBusyRef.current = false;
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();
      setSnapshot(null);
      setFaceCheck({
        canCapture: false,
        status: 'loading',
        message: 'Loading face detector...',
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        faceCheckIntervalRef.current = window.setInterval(() => {
          void runFaceCheck();
        }, 700);
        window.setTimeout(() => {
          void runFaceCheck();
        }, 250);
      }
    } catch (err) {
      toast.error('Unable to access camera');
      setFaceCheck({
        canCapture: false,
        status: 'error',
        message: 'Camera permission is required for visitor photo.',
      });
    }
  };

  const takeSnapshot = async () => {
    if (videoRef.current && canvasRef.current) {
      const latestFaceCheck = await checkVisitorFace(videoRef.current);
      setFaceCheck(latestFaceCheck);
      if (!latestFaceCheck.canCapture) {
        toast.error(latestFaceCheck.message);
        return;
      }

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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = async () => {
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

    try {
      await addVisitor(newVisitor);
      toast.success('Visitor entry logged successfully!');
      setForm({
        phone: '', name: '', gender: '', address: '', city: '', pincode: '',
        vehicleType: '', vehicleNo: '', block: '', floor: '', company: '',
        whomToMeet: '', reason: '',
      });
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
      setSnapshot(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log visitor');
    }
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

  // Get field config
  const getFieldConfig = (fieldId: string) => {
    if (isEditMode) {
      return localFields.find(f => f.id === fieldId);
    }
    return pageSettings.columns.find(f => f.id === fieldId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 px-6 py-3 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Edit3 className="w-5 h-5" />
              <span className="font-semibold">Edit Form Fields</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <p className="text-sm text-slate-500">Click eye to show/hide fields</p>
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                hasChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Field Editor Panel (shown in edit mode) */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6"
          >
            <p className="text-sm font-medium text-indigo-700 mb-3">Click eye to show/hide form fields:</p>
            <Reorder.Group
              axis="x"
              values={localFields}
              onReorder={handleFieldReorder}
              className="flex flex-wrap gap-2"
            >
              {localFields.map((field) => (
                <Reorder.Item
                  key={field.id}
                  value={field}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all',
                    field.visible 
                      ? 'bg-white border border-indigo-300 shadow-sm' 
                      : 'bg-slate-100 border border-slate-200 opacity-60'
                  )}
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    field.visible ? 'text-slate-700' : 'text-slate-400'
                  )}>
                    {field.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFieldVisibilityToggle(field.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      'p-1 rounded transition-colors',
                      field.visible 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",
          isEditMode && "ring-2 ring-indigo-400 ring-offset-2"
        )}
      >
        {/* Header */}
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Visitor's Entry Form</h2>
          <p className="text-sm text-slate-500">Please fill up the details below</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Visitor Details */}
            <div className="space-y-5">
              {/* Phone with OTP - Always visible as it's required */}
              <AnimatePresence>
                {(isFieldVisible('phone') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('phone') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('phone')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('phone') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('phone') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Name */}
              <AnimatePresence>
                {(isFieldVisible('name') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('name') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('name')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('name') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('name') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visitor's Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gender */}
              <AnimatePresence>
                {(isFieldVisible('gender') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('gender') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('gender')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('gender') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('gender') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Address */}
              <AnimatePresence>
                {(isFieldVisible('address') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('address') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('address')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('address') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('address') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Visitor's Address</label>
                    <input
                      type="text"
                      placeholder="Enter address"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* City */}
              <AnimatePresence>
                {(isFieldVisible('city') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('city') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('city')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('city') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('city') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">City</label>
                    <input
                      type="text"
                      placeholder="Enter city"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pincode */}
              <AnimatePresence>
                {(isFieldVisible('pincode') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('pincode') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('pincode')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('pincode') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('pincode') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Pincode</label>
                    <input
                      type="text"
                      placeholder="Enter pincode"
                      value={form.pincode}
                      onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                      maxLength={6}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vehicle Type */}
              <AnimatePresence>
                {(isFieldVisible('vehicleType') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('vehicleType') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('vehicleType')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('vehicleType') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('vehicleType') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Middle Column - Office Details */}
            <div className="space-y-5">
              {/* Check In Time - Always visible */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Check In Time</label>
                <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {currentTime}
                </div>
              </div>

              {/* Block */}
              <AnimatePresence>
                {(isFieldVisible('block') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('block') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('block')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('block') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('block') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floor */}
              <AnimatePresence>
                {(isFieldVisible('floor') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('floor') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('floor')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('floor') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('floor') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Company */}
              <AnimatePresence>
                {(isFieldVisible('company') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('company') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('company')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('company') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('company') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Whom to Meet */}
              <AnimatePresence>
                {(isFieldVisible('whomToMeet') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('whomToMeet') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('whomToMeet')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('whomToMeet') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('whomToMeet') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Whom to Meet</label>
                    <input
                      type="text"
                      placeholder="Enter person name"
                      value={form.whomToMeet}
                      onChange={e => setForm(f => ({ ...f, whomToMeet: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reason */}
              <AnimatePresence>
                {(isFieldVisible('reason') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('reason') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('reason')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('reason') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('reason') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason</label>
                    <input
                      type="text"
                      placeholder="Enter reason for visit"
                      value={form.reason}
                      onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vehicle Number */}
              <AnimatePresence>
                {(isFieldVisible('vehicleNo') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('vehicleNo') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('vehicleNo')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('vehicleNo') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('vehicleNo') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="e.g. KA-01-AB-1234"
                      value={form.vehicleNo}
                      onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column - Snapshot */}
            <div className="space-y-5">
              <AnimatePresence>
                {(isFieldVisible('photo') || isEditMode) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative",
                      isEditMode && "p-3 rounded-lg border-2 border-dashed",
                      isEditMode && isFieldVisible('photo') ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50/30 opacity-50"
                    )}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => handleFieldVisibilityToggle('photo')}
                        className={cn(
                          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                          isFieldVisible('photo') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                        )}
                      >
                        {isFieldVisible('photo') ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
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
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={cn(
                              "w-48 h-48 object-cover rounded-xl mx-auto border-4 transition-colors",
                              faceCheck.status === 'ready' ? 'border-emerald-500' :
                                faceCheck.status === 'error' ? 'border-red-400' :
                                'border-amber-300'
                            )}
                          />
                          <p
                            className={cn(
                              "text-xs font-medium",
                              faceCheck.status === 'ready' ? 'text-emerald-700' :
                                faceCheck.status === 'error' ? 'text-red-600' :
                                'text-amber-700'
                            )}
                          >
                            {faceCheck.message}
                          </p>
                          <button
                            onClick={takeSnapshot}
                            disabled={!faceCheck.canCapture}
                            className={cn(
                              "px-4 py-2 text-white text-sm rounded-lg transition-colors flex items-center gap-2 mx-auto",
                              faceCheck.canCapture
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-slate-400 cursor-not-allowed"
                            )}
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
                  </motion.div>
                )}
              </AnimatePresence>
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
      </motion.div>

      {/* Floating Customize Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <AnimatePresence>
          {!isEditMode && (
            <>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Edit3 className="w-5 h-5" />
                <span className="font-medium text-sm">Edit Form Fields</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium text-sm">Advanced</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Customizer Modal */}
      <UICustomizer
        page="entryVisitors"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Entry Visitors Form"
      />
    </div>
  );
}
