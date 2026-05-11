import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  QrCode, KeyRound, Users, Car, HardHat,
  CheckCircle2, Clock, LogOut, Search, Bell, ShieldCheck,
  Scan, UserCheck, CarFront, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function SecurityDashboard() {
  const [otpInput, setOtpInput] = useState('');
  const [activeTab, setActiveTab] = useState<'visitors' | 'vehicles' | 'workers'>('visitors');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { visitors, vehicles, dailyWorkers, checkOutVisitor, checkOutVehicle } = useAppStore();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const activeVisitors = visitors.filter(v => v.status === 'Inside');
  const activeVehicles = vehicles.filter(v => v.status === 'Inside');
  const activeWorkers = dailyWorkers.filter(w => w.status === 'Active');

  const handleOTPVerify = () => {
    if (!otpInput || otpInput.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    const visitor = visitors.find(v => v.otp === otpInput && v.status === 'Inside');
    
    if (visitor) {
      toast({
        title: 'Visitor Verified!',
        description: `${visitor.name} - Visiting ${visitor.apartmentNo}`,
      });
    } else {
      const pendingVisitor = visitors.find(v => v.otp === otpInput && v.status === 'Approved');
      if (pendingVisitor) {
        toast({
          title: 'Entry Approved',
          description: `${pendingVisitor.name} can enter - Visiting ${pendingVisitor.apartmentNo}`,
        });
      } else {
        toast({
          title: 'OTP Not Found',
          description: 'No visitor found with this OTP',
          variant: 'destructive',
        });
      }
    }
    setOtpInput('');
  };

  const handleCheckout = (id: string, type: 'visitor' | 'vehicle') => {
    if (type === 'visitor') {
      checkOutVisitor(id);
      toast({ title: 'Visitor Checked Out', description: 'Exit recorded successfully' });
    } else {
      checkOutVehicle(id);
      toast({ title: 'Vehicle Checked Out', description: 'Exit recorded successfully' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredVisitors = activeVisitors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.apartmentNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVehicles = activeVehicles.filter(v =>
    v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-[Outfit]">Security Dashboard</h1>
              <p className="text-xs text-slate-500">{user?.name || 'Security Guard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeVisitors.length}</p>
                <p className="text-xs text-slate-500">Visitors Inside</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeVehicles.length}</p>
                <p className="text-xs text-slate-500">Vehicles Inside</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <HardHat className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeWorkers.length}</p>
                <p className="text-xs text-slate-500">Active Workers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* QR Scanner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">QR Scanner</h2>
                <p className="text-xs text-slate-500">Scan visitor or worker QR code</p>
              </div>
            </div>
            <div className="aspect-square max-w-[250px] mx-auto bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4">
              <Scan className="w-16 h-16 text-slate-400" />
              <p className="text-slate-500 text-sm">Camera access required</p>
              <button className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors">
                Enable Camera
              </button>
            </div>
          </div>

          {/* OTP Verification */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">OTP Verification</h2>
                <p className="text-xs text-slate-500">Enter visitor's 6-digit OTP</p>
              </div>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                maxLength={6}
                className="w-full px-4 py-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 text-center text-3xl tracking-[0.5em] placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleOTPVerify}
                  className="py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-sm"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Verify Entry
                </button>
                <button
                  onClick={() => setOtpInput('')}
                  className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-lg border border-slate-200"
                >
                  <RefreshCw className="w-6 h-6" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Entries */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'visitors'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              Visitors ({activeVisitors.length})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'vehicles'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CarFront className="w-5 h-5" />
              Vehicles ({activeVehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`flex-1 py-4 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'workers'
                  ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HardHat className="w-5 h-5" />
              Workers ({activeWorkers.length})
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, apartment, or vehicle..."
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {activeTab === 'visitors' && (
              <div className="divide-y divide-slate-100">
                {filteredVisitors.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active visitors</p>
                  </div>
                ) : (
                  filteredVisitors.map((visitor) => (
                    <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {visitor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{visitor.name}</p>
                          <p className="text-sm text-slate-500">{visitor.apartmentNo} • {visitor.purpose}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">Entry: {formatTime(visitor.entryTime)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckout(visitor.id, 'visitor')}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Check Out
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="divide-y divide-slate-100">
                {filteredVehicles.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active vehicles</p>
                  </div>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          <Car className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{vehicle.vehicleNo}</p>
                          <p className="text-sm text-slate-500">{vehicle.ownerName} • {vehicle.apartmentNo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">Entry: {formatTime(vehicle.entryTime)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckout(vehicle.id, 'vehicle')}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Check Out
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'workers' && (
              <div className="divide-y divide-slate-100">
                {activeWorkers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <HardHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active workers</p>
                  </div>
                ) : (
                  activeWorkers.map((worker) => (
                    <div key={worker.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{worker.name}</p>
                          <p className="text-sm text-slate-500">{worker.role} • {worker.apartmentNo}</p>
                          <p className="text-xs text-slate-400 mt-1">Allowed: {worker.allowedTimings}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        Active
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}