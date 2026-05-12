import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, ChevronRight, Palette, LayoutGrid, Columns, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [form, setForm] = useState({
    fullName: user?.name || '',
    username: user?.email?.split('@')[0] || '',
    contactNumber: user?.phone || '',
    emailAddress: user?.email || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would update the user profile via API
    toast.success('Profile updated successfully!');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  return (
    <div className="space-y-6">
      {/* UI Settings Card */}
      <div 
        onClick={() => navigate('/settings')}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-[Outfit]">UI Settings</h2>
              <p className="text-white/80 text-sm mt-1">Customize your dashboard layout and preferences</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
        
        <div className="flex gap-6 mt-5 pt-5 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <LayoutGrid className="w-4 h-4" />
            <span>Rearrange Cards</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Columns className="w-4 h-4" />
            <span>Hide Columns</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Eye className="w-4 h-4" />
            <span>Toggle Buttons</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-700">Please update your details below</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Registered At */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Registered At
              </label>
              <input
                type="text"
                value={formatDate(user?.createdAt)}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={form.emailAddress}
                onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Username */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full md:w-1/2 px-4 py-2.5 border border-amber-300 bg-amber-50 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-base font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
            >
              Make Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}