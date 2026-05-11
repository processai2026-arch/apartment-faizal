import { Bell, Search, Menu } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/apartments': 'Manage Apartments',
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
};

export default function Header() {
  const { sidebarCollapsed, toggleSidebar, visitors } = useAppStore();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'ApartmentOS';
  const unreadCount = visitors.filter(v => v.status === 'Inside').length;

  return (
    <header className="fixed top-0 right-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '72px' : '240px' }}>
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
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>

        <div className="relative">
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:bg-indigo-600 transition-colors">
          A
        </div>
      </div>
    </header>
  );
}
