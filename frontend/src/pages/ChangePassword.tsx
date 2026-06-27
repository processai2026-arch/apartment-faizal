import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ChangePassword() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    existingPassword: '',
    newPassword: '',
  });
  
  const [showExisting, setShowExisting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.existingPassword || !form.newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (form.newPassword.length < 10) {
      toast.error('New password must be at least 10 characters');
      return;
    }
    
    setSaving(true);
    try {
      await api.changePassword(form.existingPassword, form.newPassword);
      toast.success('Password changed. Please sign in again.');
      setForm({ existingPassword: '', newPassword: '' });
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not change password');
    } finally {
      setSaving(false);
    }
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
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-700">Please update your details below</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Existing Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Existing Password
              </label>
              <div className="relative">
                <input
                  type={showExisting ? 'text' : 'password'}
                  value={form.existingPassword}
                  onChange={(e) => setForm({ ...form, existingPassword: e.target.value })}
                  placeholder="Enter existing password"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowExisting(!showExisting)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showExisting ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-base font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Make Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
