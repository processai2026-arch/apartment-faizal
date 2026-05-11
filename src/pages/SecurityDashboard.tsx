import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Users, Car, HardHat, LogOut, Search, Clock, QrCode,
  UserPlus, LogIn, Shield, X, Phone, Send, CheckCircle, Building2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { visitors, vehicles, dailyWorkers, offices, checkOutVisitor, checkOutVehicle, addVisitor } = useAppStore();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visitors' | 'vehicles' | 'workers'>('visitors');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Add Visitor Form State
  const [visitorForm, setVisitorForm] = useState({
    name: '',
    phone: '',
    officeId: '',
    whomToMeet: '',
    reason: 'Meeting',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    city: '',
    pincode: '',
    vehicleNo: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Filter active entries
  const activeVisitors = visitors.filter(v => v.status === 'Inside');
  const activeVehicles = vehicles.filter(v => v.status === 'Inside');
  const activeWorkers = dailyWorkers.filter(w => w.status === 'Active');

  // Search filter
  const filteredVisitors = activeVisitors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.whomToMeet.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVehicles = activeVehicles.filter(v =>
    v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredWorkers = activeWorkers.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.apartmentNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckOutVisitor = (id: string, name: string) => {
    checkOutVisitor(id);
    toast({
      title: 'Visitor Checked Out',
      description: `${name} has been checked out successfully`,
    });
  };

  const handleCheckOutVehicle = (id: string, vehicleNo: string) => {
    checkOutVehicle(id);
    toast({
      title: 'Vehicle Checked Out',
      description: `${vehicleNo} has been checked out successfully`,
    });
  };

  // Get selected office details
  const selectedOffice = offices.find(o => o.id === visitorForm.officeId);

  // Send OTP to visitor
  const handleSendOTP = () => {
    if (!visitorForm.name || !visitorForm.phone || !visitorForm.officeId || !visitorForm.whomToMeet) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Generate a random 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    
    toast({
      title: 'OTP Sent',
      description: `OTP ${newOtp} sent to ${visitorForm.phone} (Demo: OTP shown for testing)`,
    });
  };

  // Verify OTP and add visitor
  const handleVerifyAndAddVisitor = () => {
    if (otp !== generatedOtp) {
      toast({
        title: 'Invalid OTP',
        description: 'The OTP entered is incorrect',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    
    // Add visitor to the system
    const newVisitor = {
      id: `V${Date.now()}`,
      name: visitorForm.name,
      phone: visitorForm.phone,
      gender: visitorForm.gender,
      address: visitorForm.address,
      city: visitorForm.city,
      pincode: visitorForm.pincode,
      block: selectedOffice?.block || '',
      floorNumber: selectedOffice?.floorNumber || '',
      companyName: selectedOffice?.companyName || '',
      whomToMeet: visitorForm.whomToMeet,
      reason: visitorForm.reason,
      category: 'Guest' as const,
      status: 'Inside' as const,
      entryTime: new Date().toISOString(),
      guardName: user?.name || 'Security',
      otp: generatedOtp,
      vehicleNo: visitorForm.vehicleNo || undefined,
    };

    addVisitor(newVisitor);

    toast({
      title: 'Visitor Entry Logged',
      description: `${visitorForm.name} has been checked in successfully`,
    });

    // Reset form
    resetAddVisitorForm();
  };

  // Reset add visitor form
  const resetAddVisitorForm = () => {
    setVisitorForm({
      name: '',
      phone: '',
      officeId: '',
      whomToMeet: '',
      reason: 'Meeting',
      gender: 'Male',
      address: '',
      city: '',
      pincode: '',
      vehicleNo: '',
    });
    setOtpSent(false);
    setOtp('');
    setGeneratedOtp('');
    setIsVerifying(false);
    setShowAddVisitorModal(false);
  };

  // QR Code URL for visitor self-registration
  const qrCodeUrl = `${window.location.origin}/scan/visitor-entry`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-[Outfit]">OfficeGate Security</h1>
              <p className="text-xs text-slate-500">Welcome, {user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
            >
              <QrCode className="w-5 h-5" />
              <span className="hidden sm:inline">Show Gate QR</span>
            </button>
            <button
              onClick={() => setShowAddVisitorModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Visitor</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeVisitors.length}</p>
                <p className="text-xs text-slate-500">Visitors Inside</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeVehicles.length}</p>
                <p className="text-xs text-slate-500">Vehicles Inside</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <HardHat className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeWorkers.length}</p>
                <p className="text-xs text-slate-500">Active Workers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-indigo-900">Visitor Entry Options</h3>
              <p className="text-sm text-indigo-700 mt-1">
                <strong>Smartphone visitors:</strong> Click "Show Gate QR" and let them scan it to self-register.<br/>
                <strong>Button phone visitors:</strong> Click "Add Visitor" to manually enter their details and verify OTP.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'visitors'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Visitors ({activeVisitors.length})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'vehicles'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Car className="w-4 h-4" />
              Vehicles ({activeVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'workers'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HardHat className="w-4 h-4" />
              Workers ({activeWorkers.length})
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, company, or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {activeTab === 'visitors' && (
              filteredVisitors.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No visitors inside</p>
                </div>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {visitor.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{visitor.name}</p>
                        <p className="text-xs text-slate-500">{visitor.companyName} • Floor {visitor.floorNumber}</p>
                        <p className="text-xs text-slate-400">Meeting: {visitor.whomToMeet} • {visitor.reason}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Entry: {formatTime(visitor.entryTime)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckOutVisitor(visitor.id, visitor.name)}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <LogIn className="w-4 h-4 rotate-180" />
                      Check Out
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === 'vehicles' && (
              filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No vehicles inside</p>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{vehicle.vehicleNo}</p>
                        <p className="text-xs text-slate-500">{vehicle.type} • {vehicle.ownerName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Entry: {formatTime(vehicle.entryTime)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckOutVehicle(vehicle.id, vehicle.vehicleNo)}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <LogIn className="w-4 h-4 rotate-180" />
                      Check Out
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === 'workers' && (
              filteredWorkers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <HardHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active workers</p>
                </div>
              ) : (
                filteredWorkers.map((worker) => (
                  <div key={worker.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{worker.name}</p>
                        <p className="text-xs text-slate-500">{worker.role} • {worker.apartmentNo}</p>
                        <p className="text-xs text-slate-400">{worker.allowedTimings}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                      Active
                    </span>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </main>

      {/* Gate QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-[Outfit]">Gate QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 inline-block mb-4">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Visitors with smartphones can scan this QR code to register themselves.
              </p>
              <p className="text-xs text-slate-400">
                URL: {qrCodeUrl}
              </p>
            </div>
            
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Visitor Modal */}
      {showAddVisitorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-[Outfit]">Add Visitor</h3>
              <button
                onClick={resetAddVisitorForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              For visitors without smartphones. Enter their details and verify OTP.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visitor Name *</label>
                <input
                  type="text"
                  value={visitorForm.name}
                  onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                  placeholder="Enter visitor name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={otpSent}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={visitorForm.phone}
                    onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={otpSent}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select
                  value={visitorForm.gender}
                  onChange={(e) => setVisitorForm({ ...visitorForm, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={otpSent}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visiting Office *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={visitorForm.officeId}
                    onChange={(e) => setVisitorForm({ ...visitorForm, officeId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={otpSent}
                  >
                    <option value="">Select Office</option>
                    {offices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.companyName} - Floor {office.floorNumber} ({office.block})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Whom to Meet *</label>
                <input
                  type="text"
                  value={visitorForm.whomToMeet}
                  onChange={(e) => setVisitorForm({ ...visitorForm, whomToMeet: e.target.value })}
                  placeholder="Person's name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={otpSent}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                <select
                  value={visitorForm.reason}
                  onChange={(e) => setVisitorForm({ ...visitorForm, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={otpSent}
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Interview">Interview</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Official">Official</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={visitorForm.address}
                  onChange={(e) => setVisitorForm({ ...visitorForm, address: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={otpSent}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={visitorForm.city}
                    onChange={(e) => setVisitorForm({ ...visitorForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={otpSent}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={visitorForm.pincode}
                    onChange={(e) => setVisitorForm({ ...visitorForm, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={otpSent}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number (Optional)</label>
                <input
                  type="text"
                  value={visitorForm.vehicleNo}
                  onChange={(e) => setVisitorForm({ ...visitorForm, vehicleNo: e.target.value })}
                  placeholder="e.g., KA-01-AB-1234"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={otpSent}
                />
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOTP}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send OTP to Visitor
                </button>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">OTP sent to {visitorForm.phone}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Demo OTP: {generatedOtp}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Enter OTP from Visitor *</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleVerifyAndAddVisitor}
                    disabled={otp.length !== 6 || isVerifying}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify & Log Entry
                  </button>

                  <button
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    ← Back to Edit Details
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}