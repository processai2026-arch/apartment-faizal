import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, LayoutDashboard, Users, Car, Building2, Wallet,
  LogIn, LogOut, Home, QrCode, ChevronRight, RotateCcw,
  Eye, EyeOff, Palette, Monitor, Smartphone, ArrowLeft
} from 'lucide-react';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import type { UISettings } from '@/types/uiSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PageKey = keyof UISettings;

interface PageConfig {
  key: PageKey;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  hasCards: boolean;
  hasColumns: boolean;
  hasButtons: boolean;
  hasSections: boolean;
}

const pageConfigs: PageConfig[] = [
  {
    key: 'adminDashboard',
    title: 'Admin Dashboard',
    description: 'Stats cards, charts, and recent activity table',
    icon: <LayoutDashboard className="w-5 h-5" />,
    color: 'indigo',
    hasCards: true,
    hasColumns: true,
    hasButtons: true,
    hasSections: false,
  },
  {
    key: 'residentDashboard',
    title: 'Resident Dashboard',
    description: 'Welcome section, quick actions, stats, and lists',
    icon: <Home className="w-5 h-5" />,
    color: 'purple',
    hasCards: true,
    hasColumns: false,
    hasButtons: true,
    hasSections: true,
  },
  {
    key: 'securityDashboard',
    title: 'Security Dashboard',
    description: 'Stats cards, visitor/vehicle lists',
    icon: <Users className="w-5 h-5" />,
    color: 'green',
    hasCards: true,
    hasColumns: true,
    hasButtons: true,
    hasSections: false,
  },
  {
    key: 'visitorManagement',
    title: 'Visitor Management',
    description: 'Visitor table columns and action buttons',
    icon: <Users className="w-5 h-5" />,
    color: 'blue',
    hasCards: false,
    hasColumns: true,
    hasButtons: true,
    hasSections: false,
  },
  {
    key: 'financialTracking',
    title: 'Financial Tracking',
    description: 'Summary cards, chart, and payment table',
    icon: <Wallet className="w-5 h-5" />,
    color: 'emerald',
    hasCards: true,
    hasColumns: true,
    hasButtons: true,
    hasSections: false,
  },
  {
    key: 'entryVisitors',
    title: 'Entry Visitors',
    description: 'Form sections and action buttons',
    icon: <LogIn className="w-5 h-5" />,
    color: 'amber',
    hasCards: false,
    hasColumns: false,
    hasButtons: true,
    hasSections: true,
  },
  {
    key: 'checkOutVisitors',
    title: 'Check Out Visitors',
    description: 'Visitor list columns and checkout buttons',
    icon: <LogOut className="w-5 h-5" />,
    color: 'red',
    hasCards: false,
    hasColumns: true,
    hasButtons: true,
    hasSections: false,
  },
  {
    key: 'manageApartment',
    title: 'Manage Apartments',
    description: 'Apartment table columns and action buttons',
    icon: <Building2 className="w-5 h-5" />,
    color: 'slate',
    hasCards: false,
    hasColumns: true,
    hasButtons: true,
    hasSections: false,
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', border: 'border-indigo-200' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', border: 'border-purple-200' },
  green: { bg: 'bg-green-50', icon: 'bg-green-500', border: 'border-green-200' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500', border: 'border-red-200' },
  slate: { bg: 'bg-slate-50', icon: 'bg-slate-500', border: 'border-slate-200' },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, resetAllSettings } = useUISettingsStore();
  const [selectedPage, setSelectedPage] = useState<PageKey | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handleOpenCustomizer = (pageKey: PageKey) => {
    setSelectedPage(pageKey);
    setIsCustomizerOpen(true);
  };

  const handleCloseCustomizer = () => {
    setIsCustomizerOpen(false);
    setSelectedPage(null);
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all UI settings to default? This cannot be undone.')) {
      resetAllSettings();
      toast.success('All settings have been reset to default!');
    }
  };

  const getPageStats = (pageKey: PageKey) => {
    const pageSettings = settings[pageKey];
    const hiddenCards = pageSettings.cards.filter(c => !c.visible).length;
    const hiddenColumns = pageSettings.columns.filter(c => !c.visible).length;
    const hiddenButtons = pageSettings.buttons.filter(b => !b.visible).length;
    const hiddenSections = pageSettings.sections.filter(s => !s.visible).length;
    const totalHidden = hiddenCards + hiddenColumns + hiddenButtons + hiddenSections;
    return { hiddenCards, hiddenColumns, hiddenButtons, hiddenSections, totalHidden };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-[Outfit]">UI Settings</h1>
            <p className="text-sm text-slate-500">Customize the appearance and layout of each page</p>
          </div>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All Settings
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Personalize Your Experience</h3>
            <p className="text-white/80 text-sm mt-1">
              Customize each page by showing/hiding cards, rearranging columns, and toggling buttons.
              Your preferences are saved automatically and persist across sessions.
            </p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="w-4 h-4" />
                <span>Desktop optimized</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Mobile responsive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pageConfigs.map((page) => {
          const colors = colorClasses[page.color];
          const stats = getPageStats(page.key);
          
          return (
            <div
              key={page.key}
              className={cn(
                'bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group',
                colors.border
              )}
              onClick={() => handleOpenCustomizer(page.key)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white', colors.icon)}>
                      {page.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{page.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{page.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {page.hasCards && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      Cards
                    </span>
                  )}
                  {page.hasColumns && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      Columns
                    </span>
                  )}
                  {page.hasButtons && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      Buttons
                    </span>
                  )}
                  {page.hasSections && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      Sections
                    </span>
                  )}
                </div>

                {/* Hidden Items Indicator */}
                {stats.totalHidden > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{stats.totalHidden} item{stats.totalHidden > 1 ? 's' : ''} hidden</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Show/Hide Elements</p>
              <p className="text-xs text-slate-500 mt-0.5">Toggle visibility of cards, columns, and buttons</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Drag to Reorder</p>
              <p className="text-xs text-slate-500 mt-0.5">Rearrange items by dragging them up or down</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Reset Anytime</p>
              <p className="text-xs text-slate-500 mt-0.5">Restore default settings for any page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customizer Modal */}
      {selectedPage && (
        <UICustomizer
          page={selectedPage}
          isOpen={isCustomizerOpen}
          onClose={handleCloseCustomizer}
          pageTitle={pageConfigs.find(p => p.key === selectedPage)?.title || ''}
        />
      )}
    </div>
  );
}