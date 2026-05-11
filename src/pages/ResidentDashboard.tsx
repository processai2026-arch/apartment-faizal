import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Users, UserPlus, Package, HardHat, AlertTriangle, Car, Wallet,
  Clock, Bell, Home, QrCode, MessageSquare, Phone, ChevronRight,
  Building2, CreditCard, FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const { visitors, vehicles, dailyWorkers, complaints, apartments } = useAppStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const isOwner = user?.role === 'owner' || user?.role === 'owner-resident';
  const isTenant = user?.role === 'tenant' || user?.role === 'owner-resident';

  // Get user's apartment
  const userApartment = apartments.find(a => a.id === user?.apartmentId);

  // Filter data for user's apartment
  const myVisitors = visitors.filter(v => v.apartmentNo === userApartment?.unitNo);
  const activeVisitors = myVisitors.filter(v => v.status === 'Inside');
  const todayVisitors = myVisitors.filter(v => {
    const entry = new Date(v.entryTime);
    const today = new Date();
    return entry.toDateString() === today.toDateString();
  });

  const myWorkers = dailyWorkers.filter(w => w.apartmentNo === userApartment?.unitNo || w.apartmentNo === 'All');
  const activeWorkers = myWorkers.filter(w => w.status === 'Active');

  const myComplaints = complaints.filter(c => c.apartmentNo === userApartment?.unitNo);
  const openComplaints = myComplaints.filter(c => c.status !== 'Closed' && c.status !== 'Resolved');

  const myVehicles = vehicles.filter(v => v.apartmentNo === userApartment?.unitNo);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold font-[Outfit]">{user?.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Home className="w-4 h-4 text-indigo-200" />
              <span className="text-indigo-100">{userApartment?.unitNo} • Block {userApartment?.block}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs capitalize">
                {user?.role?.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isTenant && (
          <button
            onClick={() => navigate('/visitors/entry')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <UserPlus className="w-5 h-5 text-indigo-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900 text-sm">Invite Visitor</p>
              <p className="text-xs text-slate-500">Generate OTP/QR</p>
            </div>
          </button>
        )}

        {isTenant && (
          <button
            onClick={() => toast({ title: 'Coming Soon', description: 'Worker registration will be available soon' })}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
              <HardHat className="w-5 h-5 text-amber-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900 text-sm">Add Worker</p>
              <p className="text-xs text-slate-500">Maid, Cook, etc.</p>
            </div>
          </button>
        )}

        <button
          onClick={() => toast({ title: 'Coming Soon', description: 'Complaint system will be available soon' })}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-500 transition-colors">
            <MessageSquare className="w-5 h-5 text-red-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-900 text-sm">Raise Complaint</p>
            <p className="text-xs text-slate-500">Report issues</p>
          </div>
        </button>

        <button
          onClick={() => toast({ title: 'Emergency', description: 'Emergency contacts will be shown' })}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors">
            <Phone className="w-5 h-5 text-green-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-900 text-sm">Emergency</p>
            <p className="text-xs text-slate-500">Quick contacts</p>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
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

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{todayVisitors.length}</p>
              <p className="text-xs text-slate-500">Today's Visitors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
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

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{openComplaints.length}</p>
              <p className="text-xs text-slate-500">Open Complaints</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visitors */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">Recent Visitors</h3>
            <button
              onClick={() => navigate('/visitors/manage')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {myVisitors.slice(0, 5).length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No visitors yet</p>
              </div>
            ) : (
              myVisitors.slice(0, 5).map((visitor) => (
                <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {visitor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{visitor.name}</p>
                      <p className="text-xs text-slate-500">{visitor.purpose}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      visitor.status === 'Inside'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {visitor.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{formatTime(visitor.entryTime)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daily Workers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">Daily Workers</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {myWorkers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <HardHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No workers registered</p>
              </div>
            ) : (
              myWorkers.slice(0, 5).map((worker) => (
                <div key={worker.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{worker.name}</p>
                      <p className="text-xs text-slate-500">{worker.role} • {worker.allowedTimings}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    worker.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : worker.status === 'Paused'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {worker.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Owner-specific sections */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">Property Details</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Unit Number</span>
                </div>
                <span className="font-medium text-slate-900">{userApartment?.unitNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Type</span>
                </div>
                <span className="font-medium text-slate-900">{userApartment?.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Resident</span>
                </div>
                <span className="font-medium text-slate-900">{userApartment?.residentName || 'Vacant'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Vehicles</span>
                </div>
                <span className="font-medium text-slate-900">{myVehicles.length} registered</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">Payment Status</h3>
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                userApartment?.paymentStatus === 'Paid'
                  ? 'bg-green-100 text-green-700'
                  : userApartment?.paymentStatus === 'Pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {userApartment?.paymentStatus || 'N/A'}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Monthly Charge</span>
                </div>
                <span className="font-medium text-slate-900">₹{userApartment?.monthlyCharge?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600">Last Paid</span>
                </div>
                <span className="font-medium text-slate-900">{userApartment?.lastPaid || 'N/A'}</span>
              </div>
              <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pay Now
              </button>
              <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">My Complaints</h3>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {myComplaints.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No complaints raised</p>
            </div>
          ) : (
            myComplaints.slice(0, 3).map((complaint) => (
              <div key={complaint.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    complaint.priority === 'High' || complaint.priority === 'Emergency'
                      ? 'bg-red-100 text-red-600'
                      : complaint.priority === 'Medium'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{complaint.category}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{complaint.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    complaint.status === 'Resolved' || complaint.status === 'Closed'
                      ? 'bg-green-100 text-green-700'
                      : complaint.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {complaint.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(complaint.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}