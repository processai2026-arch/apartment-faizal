import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, Eye, EyeOff, Edit3, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import type { UtilityTask } from '@/types';
import type { CardConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const taskTypes: UtilityTask['type'][] = ['Sump Cleaning', 'Drainage', 'Electrical', 'Lift', 'Pest Control', 'Fire Safety'];

export default function UtilityManagement() {
  const { utilityTasks, addUtilityTask, markUtilityDone } = useAppStore();
  const { settings, updateCardOrder, resetPageSettings } = useUISettingsStore();
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', type: 'Sump Cleaning' as UtilityTask['type'], scheduledDate: '', assignedStaff: '', notes: '' });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localCards, setLocalCards] = useState<CardConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.utilityManagement || { cards: [], columns: [], buttons: [], sections: [] };

  // Default cards if none configured
  const defaultCards: CardConfig[] = [
    { id: 'upcoming', title: 'Upcoming', visible: true, order: 0, size: 'small', collapsed: false },
    { id: 'overdue', title: 'Overdue', visible: true, order: 1, size: 'small', collapsed: false },
    { id: 'completed', title: 'Completed', visible: true, order: 2, size: 'small', collapsed: false },
  ];

  // Initialize local cards when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      const cards = pageSettings.cards.length > 0 
        ? [...pageSettings.cards].sort((a, b) => a.order - b.order)
        : defaultCards;
      setLocalCards(cards);
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.cards]);

  // Card visibility helper
  const isCardVisible = (cardId: string) => {
    if (isEditMode) {
      return localCards.find(c => c.id === cardId)?.visible ?? true;
    }
    if (pageSettings.cards.length === 0) return true;
    const card = pageSettings.cards.find(c => c.id === cardId);
    return card ? card.visible : true;
  };

  // Handle card visibility toggle
  const handleCardVisibilityToggle = (cardId: string) => {
    setLocalCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ));
    setHasChanges(true);
  };

  // Handle card reorder
  const handleCardReorder = (newOrder: CardConfig[]) => {
    const updatedCards = newOrder.map((card, index) => ({
      ...card,
      order: index,
    }));
    setLocalCards(updatedCards);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    updateCardOrder('utilityManagement', localCards);
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
    resetPageSettings('utilityManagement');
    setLocalCards(defaultCards);
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const filtered = utilityTasks.filter(t => !filter || t.type === filter);

  const statusColor: Record<string, string> = {
    Done: 'bg-green-50 border-green-200',
    Upcoming: 'bg-blue-50 border-blue-200',
    Overdue: 'bg-red-50 border-red-200',
  };

  const handleAdd = async () => {
    if (!form.description || !form.scheduledDate || !form.assignedStaff) { toast.error('Please fill all required fields'); return; }
    try {
      await addUtilityTask({ ...form, id: `U${Date.now()}`, status: 'Upcoming' });
      toast.success('Utility task added');
      setShowModal(false);
      setForm({ description: '', type: 'Sump Cleaning', scheduledDate: '', assignedStaff: '', notes: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add utility task');
    }
  };

  const upcoming = filtered.filter(t => t.status === 'Upcoming').length;
  const overdue = filtered.filter(t => t.status === 'Overdue').length;
  const done = filtered.filter(t => t.status === 'Done').length;

  // Get ordered cards for display
  const orderedCards = isEditMode 
    ? localCards 
    : (pageSettings.cards.length > 0 
        ? [...pageSettings.cards].sort((a, b) => a.order - b.order)
        : defaultCards);

  const cardData: Record<string, { count: number; cls: string }> = {
    upcoming: { count: upcoming, cls: 'text-blue-600 bg-blue-50' },
    overdue: { count: overdue, cls: 'text-red-600 bg-red-50' },
    completed: { count: done, cls: 'text-green-600 bg-green-50' },
  };

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
              <span className="font-semibold">Edit Layout</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <p className="text-sm text-slate-500">Drag to reorder • Click eye to show/hide</p>
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

      {/* Stat Cards with Edit Mode */}
      {isEditMode ? (
        <Reorder.Group
          axis="x"
          values={localCards}
          onReorder={handleCardReorder}
          className="grid grid-cols-3 gap-4"
        >
          {localCards.map((card) => {
            const data = cardData[card.id];
            return (
              <Reorder.Item
                key={card.id}
                value={card}
                className={cn(
                  'relative rounded-2xl p-4 border text-center cursor-grab active:cursor-grabbing',
                  card.visible ? data?.cls.split(' ').slice(1).join(' ') + ' border-current/10' : 'bg-slate-100 border-slate-200 opacity-50'
                )}
                whileDrag={{ scale: 1.02, zIndex: 50 }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardVisibilityToggle(card.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={cn(
                    'absolute -top-2 -right-2 p-1.5 rounded-full shadow-lg text-white z-10',
                    card.visible ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'
                  )}
                >
                  {card.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <p className={cn('text-3xl font-bold font-[Outfit]', card.visible ? data?.cls.split(' ')[0] : 'text-slate-400')}>
                  {data?.count ?? 0}
                </p>
                <p className={cn('text-sm font-medium', card.visible ? data?.cls.split(' ')[0] : 'text-slate-400')}>
                  {card.title}
                </p>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {orderedCards.filter(card => isCardVisible(card.id)).map((card) => {
            const data = cardData[card.id];
            return (
              <div key={card.id} className={`rounded-2xl p-4 ${data?.cls.split(' ').slice(1).join(' ')} border border-current/10 text-center`}>
                <p className={`text-3xl font-bold font-[Outfit] ${data?.cls.split(' ')[0]}`}>{data?.count ?? 0}</p>
                <p className={`text-sm font-medium ${data?.cls.split(' ')[0]}`}>{card.title}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Types</option>
            {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className={cn(
        "grid grid-cols-1 gap-4",
        isEditMode && "ring-2 ring-indigo-400 ring-offset-2 rounded-2xl p-2"
      )}>
        {filtered.map(task => (
          <div key={task.id} className={`bg-white rounded-2xl border p-5 card-hover shadow-sm ${statusColor[task.status] || ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={task.status} />
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{task.type}</span>
                </div>
                <h4 className="font-semibold text-slate-900 font-[Outfit]">{task.description}</h4>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                  <span>📅 Scheduled: <span className="text-slate-700 font-medium">{task.scheduledDate}</span></span>
                  {task.lastCompleted && <span>✅ Last Done: <span className="text-slate-700 font-medium">{task.lastCompleted}</span></span>}
                  <span>👷 Assigned: <span className="text-slate-700 font-medium">{task.assignedStaff}</span></span>
                </div>
                {task.notes && <p className="text-xs text-slate-400 mt-2 italic">{task.notes}</p>}
              </div>
              {task.status !== 'Done' && (
                <button onClick={async () => {
                  try {
                    await markUtilityDone(task.id);
                    toast.success('Task marked as done');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Could not mark task done');
                  }
                }}
                  className="flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex-shrink-0">
                  <CheckCircle className="w-4 h-4" /> Mark Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Edit Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {!isEditMode && (
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
          )}
        </AnimatePresence>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Add Utility Task</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as UtilityTask['type'] }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Scheduled Date</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Assigned Staff</label>
                <input value={form.assignedStaff} onChange={e => setForm(f => ({ ...f, assignedStaff: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
