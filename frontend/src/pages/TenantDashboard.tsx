import { useState, useEffect, useCallback } from 'react';
import {
  Users, Package, CreditCard, User, Bell, CheckCircle, XCircle,
  Clock, Home, Phone, Mail, Calendar, FileText, AlertCircle,
  ChevronRight, Plus, Eye, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { api, type TenantDashboardDto } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const POLL_MS = 20000;

// Mock data for tenant
const mockPendingApprovals = [
  { id: 'PA001', visitorName: 'Rahul Kumar', phone: '9876543210', purpose: 'Delivery', requestedTime: '2026-05-13 10:30 AM', status: 'pending' },
  { id: 'PA002', visitorName: 'Priya Sharma', phone: '9876543211', purpose: 'Guest Visit', requestedTime: '2026-05-13 02:00 PM', status: 'pending' },
];

const mockParcels = [
  { id: 'P001', courier: 'Amazon', trackingNo: 'AMZ123456789', status: 'Delivered', deliveredAt: '2026-05-12 11:30 AM', receivedBy: 'Security' },
  { id: 'P002', courier: 'Flipkart', trackingNo: 'FLK987654321', status: 'In Transit', expectedDelivery: '2026-05-13' },
  { id: 'P003', courier: 'Swiggy Instamart', trackingNo: 'SWG456789123', status: 'Out for Delivery', expectedDelivery: '2026-05-13' },
];

const mockPayments = [
  { id: 'PAY001', type: 'Maintenance', amount: 5000, dueDate: '2026-05-15', status: 'Pending' },
  { id: 'PAY002', type: 'Electricity', amount: 2500, dueDate: '2026-05-20', status: 'Pending' },
  { id: 'PAY003', type: 'Water', amount: 500, dueDate: '2026-05-20', status: 'Paid', paidOn: '2026-05-10' },
  { id: 'PAY004', type: 'Parking', amount: 1000, dueDate: '2026-05-25', status: 'Pending' },
];

const mockVisitorHistory = [
  { id: 'V001', name: 'Delivery - Amazon', phone: '9000111222', purpose: 'Parcel Delivery', entryTime: '2026-05-12 11:30 AM', exitTime: '2026-05-12 11:35 AM', status: 'Exited' },
  { id: 'V002', name: 'Rahul (Friend)', phone: '9876543210', purpose: 'Guest Visit', entryTime: '2026-05-11 06:00 PM', exitTime: '2026-05-11 09:00 PM', status: 'Exited' },
  { id: 'V003', name: 'Plumber - Rajesh', phone: '9876543212', purpose: 'Maintenance', entryTime: '2026-05-10 10:00 AM', exitTime: '2026-05-10 12:00 PM', status: 'Exited' },
];

type Tab = 'overview' | 'approvals' | 'parcels' | 'payments' | 'profile';

export default function TenantDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pendingApprovals, setPendingApprovals] = useState(mockPendingApprovals);

  // Live data from the backend (visitors + invoices for this tenant's office).
  const [data, setData] = useState<TenantDashboardDto | null>(null);

  const loadData = useCallback(async () => {
    try {
      setData(await api.tenant.dashboard());
    } catch {
      // keep last good data; silent on poll failures
    }
  }, []);

  useEffect(() => {
    loadData();
    const t = window.setInterval(loadData, POLL_MS);
    return () => window.clearInterval(t);
  }, [loadData]);

  // Real values derived from backend; fall back to 0/empty before first load.
  const realVisitors = data?.visitors ?? [];
  const realInvoices = data?.invoices ?? [];
  const officeLabel = data?.office
    ? `Unit: ${String(data.office.floor_number ?? '')} - ${String(data.office.company_name ?? '')} | Block: ${String(data.office.block ?? '')}`
    : 'Loading unit…';
  const visitorsThisMonth = data?.summary.visitorsThisMonth ?? 0;
  const realPendingPaymentsTotal = data?.summary.pendingPaymentsAmount ?? 0;
  const realPendingPaymentsCount = data?.summary.pendingPayments ?? 0;

  const handleApprove = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    toast.success('Visitor approved! They will receive entry permission.');
  };

  const handleReject = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    toast.error('Visitor request rejected.');
  };

  const handlePayNow = (paymentId: string, type: string, amount: number) => {
    toast.success(`Payment of ₹${amount.toLocaleString()} for ${type} initiated!`);
  };

  const pendingPaymentsTotal = mockPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const parcelsToCollect = mockParcels.filter(p => p.status === 'Delivered').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'approvals', label: 'Visitor Approvals', icon: Users, badge: pendingApprovals.length },
    { id: 'parcels', label: 'Parcels', icon: Package, badge: parcelsToCollect },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Service Hub Banner */}
      <div
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 rounded-2xl p-5 text-white cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => navigate('/tenant/hub')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/tenant/hub'); }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base font-[Outfit]">Resident Service Hub</p>
              <p className="text-indigo-200 text-sm mt-0.5">Complaints, maintenance, marketplace, events &amp; more in one place</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0">
            Explore All Services
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[Outfit]">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-indigo-100 mt-1">{officeLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors relative">
              <Bell className="w-5 h-5" />
              {pendingApprovals.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-bold',
                activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 text-red-600'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Pending Approvals" value={pendingApprovals.length} icon={Users} color="amber" />
              <StatCard label="Parcels to Collect" value={parcelsToCollect} icon={Package} color="blue" />
              <StatCard label="Pending Payments" value={`₹${realPendingPaymentsTotal.toLocaleString()}`} icon={CreditCard} color="red" />
              <StatCard label="Visitors This Month" value={visitorsThisMonth} icon={Clock} color="green" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('approvals')}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Approve Visitors</h3>
                <p className="text-xs text-slate-500 mt-1">{pendingApprovals.length} pending requests</p>
              </button>
              <button
                onClick={() => setActiveTab('parcels')}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Track Parcels</h3>
                <p className="text-xs text-slate-500 mt-1">{mockParcels.length} active shipments</p>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Pay Bills</h3>
                <p className="text-xs text-slate-500 mt-1">₹{realPendingPaymentsTotal.toLocaleString()} due ({realPendingPaymentsCount})</p>
              </button>
              <button
                onClick={() => toast.info('Pre-approve visitor feature coming soon!')}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Pre-approve Visitor</h3>
                <p className="text-xs text-slate-500 mt-1">Generate entry pass</p>
              </button>
            </div>

            {/* Recent Visitors */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 font-[Outfit]">Recent Visitors</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all →</button>
              </div>
              <div className="divide-y divide-slate-50">
                {realVisitors.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No visitors recorded for your unit yet.</div>
                ) : realVisitors.slice(0, 5).map((visitor) => {
                  const name = String(visitor.name ?? 'Visitor');
                  const reason = String(visitor.reason ?? visitor.whom_to_meet ?? 'Visit');
                  const entry = visitor.entry_time ? new Date(String(visitor.entry_time)).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                  const status = String(visitor.status ?? 'Inside');
                  return (
                    <div key={String(visitor.id)} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{reason} • {entry}</p>
                        </div>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'approvals' && (
          <motion.div
            key="approvals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 font-[Outfit]">Pending Visitor Approvals</h3>
                <p className="text-sm text-slate-500 mt-1">Approve or reject visitor entry requests</p>
              </div>
              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-600">No pending approvals</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pendingApprovals.map(approval => (
                    <div key={approval.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-lg">
                            {approval.visitorName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{approval.visitorName}</p>
                            <p className="text-sm text-slate-500">{approval.phone}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span>📋 {approval.purpose}</span>
                              <span>🕐 {approval.requestedTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(approval.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(approval.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'parcels' && (
          <motion.div
            key="parcels"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 font-[Outfit]">Parcel Tracking</h3>
                <p className="text-sm text-slate-500 mt-1">Track your deliveries and parcels</p>
              </div>
              <div className="divide-y divide-slate-50">
                {mockParcels.map(parcel => (
                  <div key={parcel.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          parcel.status === 'Delivered' ? 'bg-green-100' : 
                          parcel.status === 'Out for Delivery' ? 'bg-amber-100' : 'bg-blue-100'
                        )}>
                          <Package className={cn(
                            'w-5 h-5',
                            parcel.status === 'Delivered' ? 'text-green-600' : 
                            parcel.status === 'Out for Delivery' ? 'text-amber-600' : 'text-blue-600'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{parcel.courier}</p>
                          <p className="text-xs text-slate-500">Tracking: {parcel.trackingNo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={parcel.status} />
                        <p className="text-xs text-slate-400 mt-1">
                          {parcel.deliveredAt ? `Delivered: ${parcel.deliveredAt}` : `Expected: ${parcel.expectedDelivery}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                <p className="text-sm text-red-600 font-medium">Total Pending</p>
                <p className="text-2xl font-bold text-red-700 font-[Outfit]">₹{pendingPaymentsTotal.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <p className="text-sm text-green-600 font-medium">Paid This Month</p>
                <p className="text-2xl font-bold text-green-700 font-[Outfit]">₹{mockPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Payment List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 font-[Outfit]">Bills & Payments</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {mockPayments.map(payment => (
                  <div key={payment.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        payment.status === 'Paid' ? 'bg-green-100' : 'bg-amber-100'
                      )}>
                        <FileText className={cn(
                          'w-5 h-5',
                          payment.status === 'Paid' ? 'text-green-600' : 'text-amber-600'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{payment.type}</p>
                        <p className="text-xs text-slate-500">
                          {payment.status === 'Paid' ? `Paid on ${payment.paidOn}` : `Due: ${payment.dueDate}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-900">₹{payment.amount.toLocaleString()}</p>
                      {payment.status === 'Pending' ? (
                        <button
                          onClick={() => handlePayNow(payment.id, payment.type, payment.amount)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                          ✓ Paid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {user?.name?.[0] || 'T'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-[Outfit]">{user?.name}</h2>
                  <p className="text-slate-500">Tenant / Owner</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="font-medium text-slate-900">{user?.email}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="font-medium text-slate-900">{user?.phone}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Home className="w-4 h-4" />
                    <span className="text-sm">Unit</span>
                  </div>
                  <p className="font-medium text-slate-900">7th Floor - M2K ADVISORS</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Member Since</span>
                  </div>
                  <p className="font-medium text-slate-900">{user?.createdAt}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Edit Profile
                </button>
                <button className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  Change Password
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}