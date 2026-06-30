import { useState, useEffect } from 'react';
import { CheckCircle, Download, Plus, X, Eye, EyeOff, Edit3, Save, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import { financialTrendData } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Apartment } from '@/types';
import type { CardConfig, ColumnConfig } from '@/types/uiSettings';

export default function FinancialTracking() {
  const { apartments, markPaymentPaid, addApartment } = useAppStore();
  const { settings, getVisibleCards, getVisibleColumns, getVisibleButtons, updateCardOrder, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [showModal, setShowModal] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localCards, setLocalCards] = useState<CardConfig[]>([]);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [form, setForm] = useState({
    unitNo: '',
    residentName: '',
    monthlyCharge: 50000,
    paymentStatus: 'Pending' as 'Paid' | 'Pending' | 'Overdue',
  });

  const pageSettings = settings.financialTracking;

  // Initialize local state when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setLocalCards([...pageSettings.cards].sort((a, b) => a.order - b.order));
      setLocalColumns([...pageSettings.columns].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.cards, pageSettings.columns]);

  const visibleCards = isEditMode ? localCards : getVisibleCards('financialTracking');
  const visibleColumns = isEditMode ? localColumns : getVisibleColumns('financialTracking');
  const visibleButtons = getVisibleButtons('financialTracking');

  // Visibility helpers
  const isCardVisible = (cardId: string) => {
    if (isEditMode) {
      return localCards.find(c => c.id === cardId)?.visible ?? false;
    }
    return visibleCards.some(c => c.id === cardId);
  };
  
  const isColumnVisible = (columnId: string) => {
    if (isEditMode) {
      return localColumns.find(c => c.id === columnId)?.visible ?? false;
    }
    return visibleColumns.some(c => c.id === columnId);
  };
  
  const isButtonVisible = (buttonId: string) => visibleButtons.some(b => b.id === buttonId);

  const getCardConfig = (cardId: string) => {
    if (isEditMode) {
      return localCards.find(c => c.id === cardId);
    }
    return pageSettings.cards.find(c => c.id === cardId);
  };

  // Handle card visibility toggle
  const handleCardVisibilityToggle = (cardId: string) => {
    setLocalCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ));
    setHasChanges(true);
  };

  // Handle column visibility toggle
  const handleColumnVisibilityToggle = (columnId: string) => {
    setLocalColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
    setHasChanges(true);
  };

  // Handle column reorder
  const handleColumnReorder = (newOrder: ColumnConfig[]) => {
    const updatedColumns = newOrder.map((col, index) => ({
      ...col,
      order: index,
    }));
    setLocalColumns(updatedColumns);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    updateCardOrder('financialTracking', localCards);
    updateColumnOrder('financialTracking', localColumns);
    setIsEditMode(false);
    setHasChanges(false);
    toast.success('Layout settings saved!');
  };

  // Cancel edit mode
  const handleCancel = () => {
    setIsEditMode(false);
    setHasChanges(false);
  };

  // Reset to default
  const handleReset = () => {
    resetPageSettings('financialTracking');
    setLocalCards([...settings.financialTracking.cards].sort((a, b) => a.order - b.order));
    setLocalColumns([...settings.financialTracking.columns].sort((a, b) => a.order - b.order));
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const filtered = apartments.filter(a => !filterStatus || a.paymentStatus === filterStatus);

  const totalCollected = apartments.filter(a => a.paymentStatus === 'Paid').reduce((s, a) => s + (a.monthlyCharge || 0), 0);
  const totalPending = apartments.filter(a => a.paymentStatus === 'Pending').reduce((s, a) => s + (a.monthlyCharge || 0), 0);
  const overdueCount = apartments.filter(a => a.paymentStatus === 'Overdue').length;

  const handleAdd = () => {
    if (!form.unitNo) {
      toast.error('Please enter unit number');
      return;
    }
    
    const newApartment: Apartment = {
      id: `APT${Date.now()}`,
      unitNo: form.unitNo,
      floor: 1,
      block: 'A',
      type: 'Office',
      status: 'Occupied',
      residentName: form.residentName || undefined,
      monthlyCharge: form.monthlyCharge,
      paymentStatus: form.paymentStatus,
      lastPaid: form.paymentStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined,
    };
    
    addApartment(newApartment);
    toast.success('Payment record added successfully');
    setShowModal(false);
    setForm({
      unitNo: '',
      residentName: '',
      monthlyCharge: 50000,
      paymentStatus: 'Pending',
    });
  };

  // Get display columns (sorted)
  const displayColumns = isEditMode 
    ? localColumns 
    : [...pageSettings.columns].sort((a, b) => a.order - b.order).filter(c => c.visible);

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
            <p className="text-sm text-slate-500">Click eye to show/hide • Drag columns to reorder</p>
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

      {/* Column Editor Panel (shown in edit mode) */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4"
          >
            <p className="text-sm font-medium text-indigo-700 mb-3">Drag to reorder columns, click eye to show/hide:</p>
            <Reorder.Group
              axis="x"
              values={localColumns}
              onReorder={handleColumnReorder}
              className="flex flex-wrap gap-2"
            >
              {localColumns.map((col) => (
                <Reorder.Item
                  key={col.id}
                  value={col}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all',
                    col.visible 
                      ? 'bg-white border border-indigo-300 shadow-sm' 
                      : 'bg-slate-100 border border-slate-200 opacity-60'
                  )}
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    col.visible ? 'text-slate-700' : 'text-slate-400'
                  )}>
                    {col.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColumnVisibilityToggle(col.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      'p-1 rounded transition-colors',
                      col.visible 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <AnimatePresence>
        {(isCardVisible('totalCollected') || isCardVisible('totalPending') || isCardVisible('overdueCount') || isEditMode) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {(isCardVisible('totalCollected') || isEditMode) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg relative",
                  isEditMode && "ring-2 ring-indigo-400 ring-offset-2",
                  isEditMode && !getCardConfig('totalCollected')?.visible && "opacity-40"
                )}
              >
                {isEditMode && (
                  <button
                    onClick={() => handleCardVisibilityToggle('totalCollected')}
                    className={cn(
                      'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs',
                      getCardConfig('totalCollected')?.visible ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                    )}
                  >
                    {getCardConfig('totalCollected')?.visible ? '👁' : '🚫'}
                  </button>
                )}
                <p className="text-green-100 text-sm font-medium mb-1">Total Collected</p>
                <p className="text-3xl font-bold font-[Outfit]">₹{totalCollected.toLocaleString()}</p>
                <p className="text-green-200 text-xs mt-1">{apartments.filter(a => a.paymentStatus === 'Paid').length} apartments paid</p>
              </motion.div>
            )}
            {(isCardVisible('totalPending') || isEditMode) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className={cn(
                  "bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg relative",
                  isEditMode && "ring-2 ring-indigo-400 ring-offset-2",
                  isEditMode && !getCardConfig('totalPending')?.visible && "opacity-40"
                )}
              >
                {isEditMode && (
                  <button
                    onClick={() => handleCardVisibilityToggle('totalPending')}
                    className={cn(
                      'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs',
                      getCardConfig('totalPending')?.visible ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                    )}
                  >
                    {getCardConfig('totalPending')?.visible ? '👁' : '🚫'}
                  </button>
                )}
                <p className="text-amber-100 text-sm font-medium mb-1">Total Pending</p>
                <p className="text-3xl font-bold font-[Outfit]">₹{totalPending.toLocaleString()}</p>
                <p className="text-amber-200 text-xs mt-1">{apartments.filter(a => a.paymentStatus === 'Pending').length} apartments pending</p>
              </motion.div>
            )}
            {(isCardVisible('overdueCount') || isEditMode) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg relative",
                  isEditMode && "ring-2 ring-indigo-400 ring-offset-2",
                  isEditMode && !getCardConfig('overdueCount')?.visible && "opacity-40"
                )}
              >
                {isEditMode && (
                  <button
                    onClick={() => handleCardVisibilityToggle('overdueCount')}
                    className={cn(
                      'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs',
                      getCardConfig('overdueCount')?.visible ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                    )}
                  >
                    {getCardConfig('overdueCount')?.visible ? '👁' : '🚫'}
                  </button>
                )}
                <p className="text-red-100 text-sm font-medium mb-1">Overdue Count</p>
                <p className="text-3xl font-bold font-[Outfit]">{overdueCount}</p>
                <p className="text-red-200 text-xs mt-1">apartments overdue</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart */}
      <AnimatePresence>
        {(isCardVisible('collectionTrend') || isEditMode) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative",
              isEditMode && "ring-2 ring-indigo-400 ring-offset-2",
              isEditMode && !getCardConfig('collectionTrend')?.visible && "opacity-40"
            )}
          >
            {isEditMode && (
              <button
                onClick={() => handleCardVisibilityToggle('collectionTrend')}
                className={cn(
                  'absolute -top-2 -right-2 p-1 rounded-full shadow-lg text-white text-xs z-10',
                  getCardConfig('collectionTrend')?.visible ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                )}
              >
                {getCardConfig('collectionTrend')?.visible ? '👁' : '🚫'}
              </button>
            )}
            <h3 className="text-base font-semibold font-[Outfit] mb-4">Collection Trend — Last 6 Months</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={financialTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden",
          isEditMode && "ring-2 ring-indigo-400 ring-offset-2"
        )}
      >
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isButtonVisible('addRecord') && (
                <motion.button 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Record
                </motion.button>
              )}
              {isButtonVisible('export') && (
                <motion.button 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => toast.info('Export coming soon')}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  <Download className="w-4 h-4" /> Export
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {displayColumns.map((col) => (
                  <th 
                    key={col.id} 
                    className={cn(
                      "text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap",
                      isEditMode && !col.visible && "opacity-40"
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length || 6} className="px-4 py-8 text-center text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((apt, idx) => (
                  <motion.tr 
                    key={apt.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/50"
                  >
                    {displayColumns.map((col) => {
                      if (!col.visible && !isEditMode) return null;
                      
                      const cellClass = cn(
                        "px-4 py-3",
                        isEditMode && !col.visible && "opacity-40"
                      );
                      
                      switch (col.id) {
                        case 'unit':
                          return <td key={col.id} className={cn(cellClass, "font-semibold text-slate-900")}>{apt.unitNo}</td>;
                        case 'resident':
                          return <td key={col.id} className={cn(cellClass, "text-slate-700")}>{apt.residentName || <span className="text-slate-400 italic">Vacant</span>}</td>;
                        case 'monthlyCharge':
                          return <td key={col.id} className={cn(cellClass, "font-medium text-indigo-600")}>₹{apt.monthlyCharge?.toLocaleString()}</td>;
                        case 'paymentStatus':
                          return <td key={col.id} className={cellClass}><StatusBadge status={apt.paymentStatus || 'Pending'} /></td>;
                        case 'lastPaid':
                          return <td key={col.id} className={cn(cellClass, "text-slate-500 text-xs")}>{apt.lastPaid || '—'}</td>;
                        case 'action':
                          return (
                            <td key={col.id} className={cellClass}>
                              {apt.paymentStatus !== 'Paid' && (
                                <button onClick={() => { markPaymentPaid(apt.id); toast.success(`Payment marked for ${apt.unitNo}`); }}
                                  className="flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                                  <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                                </button>
                              )}
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-[Outfit]">Add Payment Record</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Unit Number *</label>
                  <input
                    value={form.unitNo}
                    onChange={e => setForm(f => ({ ...f, unitNo: e.target.value }))}
                    placeholder="e.g., A-101, 7th FLOOR-M2K"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Resident/Company Name</label>
                  <input
                    value={form.residentName}
                    onChange={e => setForm(f => ({ ...f, residentName: e.target.value }))}
                    placeholder="e.g., M2K ADVISORS"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Monthly Charge (₹)</label>
                    <input
                      type="number"
                      value={form.monthlyCharge}
                      onChange={e => setForm(f => ({ ...f, monthlyCharge: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Payment Status</label>
                    <select
                      value={form.paymentStatus}
                      onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as 'Paid' | 'Pending' | 'Overdue' }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                  Add Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Customize Buttons */}
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
                title="Edit Layout"
                aria-label="Edit Layout"
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Edit3 className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Customizer Modal */}
      <UICustomizer
        page="financialTracking"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Financial Tracking"
      />
    </div>
  );
}