import { useState, useMemo, useEffect } from 'react';
import { Users, Building2, UserCheck, Home, Clock, Package, Settings, X, Save, RotateCcw, Edit3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import { visitorTrendData, occupancyData } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import UICustomizer from '@/components/features/UICustomizer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CardConfig } from '@/types/uiSettings';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { visitors, offices, vehicles } = useAppStore();
  const { settings, getVisibleCards, getVisibleColumns, getVisibleButtons, updateCardOrder, resetPageSettings } = useUISettingsStore();
  const navigate = useNavigate();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [localCards, setLocalCards] = useState<CardConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.adminDashboard;
  const visibleCards = getVisibleCards('adminDashboard');
  const visibleColumns = getVisibleColumns('adminDashboard');
  const visibleButtons = getVisibleButtons('adminDashboard');

  // Initialize local cards when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setLocalCards([...pageSettings.cards].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.cards]);

  const todayVisitors = visitors.filter(v => {
    const entry = new Date(v.entryTime);
    const today = new Date();
    return entry.toDateString() === today.toDateString();
  }).length;

  const insideNow = visitors.filter(v => v.status === 'Inside').length;
  const totalOffices = offices?.length || 0;
  const totalCompanies = offices?.reduce((acc, o) => acc + (o.companyName ? 1 : 0), 0) || 0;
  const recentVisitors = visitors.slice(0, 8);

  // Card visibility helpers
  const isCardVisible = (cardId: string) => {
    if (isEditMode) {
      return localCards.find(c => c.id === cardId)?.visible ?? false;
    }
    return visibleCards.some(c => c.id === cardId);
  };
  
  const getCardConfig = (cardId: string) => {
    if (isEditMode) {
      return localCards.find(c => c.id === cardId);
    }
    return pageSettings.cards.find(c => c.id === cardId);
  };
  
  // Button visibility helper
  const isButtonVisible = (buttonId: string) => visibleButtons.some(b => b.id === buttonId);
  
  // Column visibility helper - default to true if no columns configured
  const isColumnVisible = (columnId: string) => {
    if (pageSettings.columns.length === 0) return true;
    return visibleColumns.some(c => c.id === columnId);
  };

  // Handle card visibility toggle in edit mode
  const handleCardVisibilityToggle = (cardId: string) => {
    setLocalCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ));
    setHasChanges(true);
  };

  // Handle card size change in edit mode
  const handleCardSizeChange = (cardId: string, size: CardConfig['size']) => {
    setLocalCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, size } : card
    ));
    setHasChanges(true);
  };

  // Handle reorder
  const handleReorder = (newOrder: CardConfig[]) => {
    const updatedCards = newOrder.map((card, index) => ({
      ...card,
      order: index,
    }));
    setLocalCards(updatedCards);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    updateCardOrder('adminDashboard', localCards);
    setIsEditMode(false);
    setHasChanges(false);
    toast.success('Dashboard layout saved!');
  };

  // Cancel edit mode
  const handleCancel = () => {
    setIsEditMode(false);
    setHasChanges(false);
  };

  // Reset to default
  const handleReset = () => {
    resetPageSettings('adminDashboard');
    setLocalCards([...settings.adminDashboard.cards].sort((a, b) => a.order - b.order));
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  // Get sorted cards for display
  const displayCards = isEditMode ? localCards : [...pageSettings.cards].sort((a, b) => a.order - b.order);

  // Render stat card based on ID
  const renderStatCard = (cardId: string, inEditMode: boolean = false) => {
    const config = getCardConfig(cardId);
    if (!config) return null;
    if (!inEditMode && !config.visible) return null;

    const cardContent = (() => {
      switch (cardId) {
        case 'totalVisitors':
          return <StatCard label="Total Visitors Today" value={todayVisitors} icon={Users} trend={{ value: 12, positive: true }} color="indigo" subtitle="All time: 847" />;
        case 'currentlyInside':
          return <StatCard label="Currently Inside" value={insideNow} icon={UserCheck} color="green" subtitle="Active visitors" />;
        case 'totalOffices':
          return <StatCard label="Total Offices" value={totalOffices} icon={Home} trend={{ value: 5, positive: true }} color="blue" />;
        case 'companies':
          return <StatCard label="Companies" value={totalCompanies} icon={Building2} color="red" subtitle="Registered companies" />;
        default:
          return null;
      }
    })();

    if (!cardContent) return null;

    return (
      <div className={cn(
        'relative',
        inEditMode && 'ring-2 ring-indigo-400 ring-offset-2 rounded-2xl',
        inEditMode && !config.visible && 'opacity-40'
      )}>
        {inEditMode && (
          <div className="absolute -top-2 -right-2 z-10 flex gap-1">
            <button
              onClick={() => handleCardVisibilityToggle(cardId)}
              className={cn(
                'p-1 rounded-full shadow-lg text-white text-xs',
                config.visible ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400 hover:bg-slate-500'
              )}
              title={config.visible ? 'Hide' : 'Show'}
            >
              {config.visible ? '👁' : '🚫'}
            </button>
          </div>
        )}
        {cardContent}
      </div>
    );
  };

  // Stat card IDs
  const statCardIds = ['totalVisitors', 'currentlyInside', 'totalOffices', 'companies'];
  const sortedStatCards = statCardIds
    .map(id => displayCards.find(c => c.id === id))
    .filter((c): c is CardConfig => c !== undefined)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
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
              <span className="font-semibold">Edit Mode</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <p className="text-sm text-slate-500">Drag cards to reorder • Click eye to show/hide</p>
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

      {/* Stats - Draggable in Edit Mode */}
      {isEditMode ? (
        <Reorder.Group
          axis="x"
          values={sortedStatCards}
          onReorder={(newOrder) => {
            // Update order for stat cards
            const otherCards = localCards.filter(c => !statCardIds.includes(c.id));
            const updatedStatCards = newOrder.map((card, index) => ({
              ...card,
              order: index,
            }));
            setLocalCards([...updatedStatCards, ...otherCards.map((c, i) => ({ ...c, order: newOrder.length + i }))]);
            setHasChanges(true);
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {sortedStatCards.map((card) => (
            <Reorder.Item
              key={card.id}
              value={card}
              className="cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.05, zIndex: 50 }}
            >
              {renderStatCard(card.id, true)}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <AnimatePresence>
          {sortedStatCards.filter(c => c.visible).length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {sortedStatCards.filter(c => c.visible).map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {renderStatCard(card.id)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Quick Actions */}
      <AnimatePresence>
        {visibleButtons.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-3"
          >
            {visibleButtons
              .sort((a, b) => a.order - b.order)
              .map((button) => {
                if (button.id === 'entryVisitor') {
                  return (
                    <motion.button
                      key={button.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate('/visitors/entry')}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Users className="w-4 h-4" /> {button.label}
                    </motion.button>
                  );
                }
                if (button.id === 'registerVehicle') {
                  return (
                    <motion.button
                      key={button.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate('/vehicles/entry')}
                      className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Package className="w-4 h-4" /> {button.label}
                    </motion.button>
                  );
                }
                if (button.id === 'viewReports') {
                  return (
                    <motion.button
                      key={button.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate('/reports')}
                      className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Clock className="w-4 h-4" /> {button.label}
                    </motion.button>
                  );
                }
                return null;
              })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts */}
      <AnimatePresence>
        {(isCardVisible('visitorTrend') || isCardVisible('occupancyStatus') || isEditMode) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {(isCardVisible('visitorTrend') || isEditMode) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative",
                  getCardConfig('visitorTrend')?.size === 'full' ? 'lg:col-span-3' : 'lg:col-span-2',
                  isEditMode && 'ring-2 ring-indigo-400 ring-offset-2',
                  isEditMode && !getCardConfig('visitorTrend')?.visible && 'opacity-40'
                )}
              >
                {isEditMode && (
                  <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                    <button
                      onClick={() => handleCardVisibilityToggle('visitorTrend')}
                      className={cn(
                        'p-1 rounded-full shadow-lg text-white text-xs',
                        getCardConfig('visitorTrend')?.visible ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400 hover:bg-slate-500'
                      )}
                    >
                      {getCardConfig('visitorTrend')?.visible ? '👁' : '🚫'}
                    </button>
                  </div>
                )}
                <h3 className="text-base font-semibold text-slate-900 font-[Outfit] mb-4">Visitor Trend — Last 7 Days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={visitorTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="visitors" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
            {(isCardVisible('occupancyStatus') || isEditMode) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative",
                  getCardConfig('occupancyStatus')?.size === 'full' ? 'lg:col-span-3' : '',
                  isEditMode && 'ring-2 ring-indigo-400 ring-offset-2',
                  isEditMode && !getCardConfig('occupancyStatus')?.visible && 'opacity-40'
                )}
              >
                {isEditMode && (
                  <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                    <button
                      onClick={() => handleCardVisibilityToggle('occupancyStatus')}
                      className={cn(
                        'p-1 rounded-full shadow-lg text-white text-xs',
                        getCardConfig('occupancyStatus')?.visible ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400 hover:bg-slate-500'
                      )}
                    >
                      {getCardConfig('occupancyStatus')?.visible ? '👁' : '🚫'}
                    </button>
                  </div>
                )}
                <h3 className="text-base font-semibold text-slate-900 font-[Outfit] mb-4">Occupancy Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {occupancyData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity */}
      <AnimatePresence>
        {(isCardVisible('recentActivity') || isEditMode) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative",
              isEditMode && 'ring-2 ring-indigo-400 ring-offset-2',
              isEditMode && !getCardConfig('recentActivity')?.visible && 'opacity-40'
            )}
          >
            {isEditMode && (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <button
                  onClick={() => handleCardVisibilityToggle('recentActivity')}
                  className={cn(
                    'p-1 rounded-full shadow-lg text-white text-xs',
                    getCardConfig('recentActivity')?.visible ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400 hover:bg-slate-500'
                  )}
                >
                  {getCardConfig('recentActivity')?.visible ? '👁' : '🚫'}
                </button>
              </div>
            )}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">Recent Visitor Activity</h3>
              <button onClick={() => navigate('/visitors/manage')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {visibleColumns
                      .sort((a, b) => a.order - b.order)
                      .map((col) => (
                        <th key={col.id} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                          {col.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentVisitors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      {isColumnVisible('visitor') && (
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{v.name}</p>
                            <p className="text-xs text-slate-400">{v.phone}</p>
                          </div>
                        </td>
                      )}
                      {isColumnVisible('office') && (
                        <td className="px-4 py-3 text-slate-700">{v.companyName || v.officeNo || v.apartmentNo || '—'}</td>
                      )}
                      {isColumnVisible('purpose') && (
                        <td className="px-4 py-3 text-slate-500">{v.reason || v.purpose || '—'}</td>
                      )}
                      {isColumnVisible('entryTime') && (
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTime(v.entryTime)}</td>
                      )}
                      {isColumnVisible('status') && (
                        <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Customize Button with Menu */}
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
                <span className="font-medium text-sm">Edit Layout</span>
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
                <Settings className="w-4 h-4" />
                <span className="font-medium text-sm">Advanced</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Customizer Modal */}
      <UICustomizer
        page="adminDashboard"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Admin Dashboard"
      />
    </div>
  );
}