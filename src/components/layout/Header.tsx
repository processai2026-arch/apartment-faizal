import { useState } from 'react';
import { Bell, Search, Menu, LogOut, User, Key, Power, ChevronDown, Settings } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/offices': 'Manage Offices',
  '/visitors/entry': 'Entry Visitors',
  '/visitors/checkout': 'Check-Out Visitors',
  '/visitors/manage': 'Visitor Management',
  '/vehicles/entry': 'Vehicle Registry',
  '/vehicles/checkout': 'Check-Out Vehicles',
  '/vendors': 'Vendor Management',
  '/staff': 'Staff Attendance',
  '/inventory': 'Inventory & Audit',
  '/utilities': 'Utility Management',
  '/financials': 'Financial Tracking',
  '/reports': 'Reports & Analytics',
  '/qr-codes': 'QR Codes & Gates',
  '/profile': 'My Profile',
  '/change-password': 'Change Password',
};

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { sidebarCollapsed, toggleSidebar, visitors } = useAppStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const title = pageTitles[location.pathname] || 'OfficeGate';
  const unreadCount = visitors.filter(v => v.status === 'Inside').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render header for security role (they have their own)
  if (user?.role === 'security') {
    return null;
  }

  return (
    <header 
      className="fixed top-0 right-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '72px' : '240px' }}
    >
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div>
        <h1 className="text-lg font-semibold text-slate-900 font-[Outfit]">{title}</h1>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white/20">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-white text-sm font-medium hidden md:block">{user?.name || 'Admin User'}</span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-20 overflow-hidden border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.15)'
                }}
              >
                {/* User Info Header */}
                <div className="px-4 py-5 text-center border-b border-white/10">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-lg border-3 border-indigo-400/30"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
                      boxShadow: '0 0 20px rgba(139,92,246,0.4)'
                    }}
                  >
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {user?.name || 'Admin User'} - {user?.role === 'admin' ? 'Web Developer' : user?.role}
                  </p>
                  <p className="text-indigo-300/70 text-xs mt-1">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="flex-1 py-2.5 px-4 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm text-center whitespace-nowrap"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/change-password');
                    }}
                    className="flex-1 py-2.5 px-4 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm text-center whitespace-nowrap"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all shadow-lg shadow-red-500/25"
                    title="Logout"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}