import { useState, useEffect, useRef } from 'react';
import { Plus, X, CheckCircle, Eye, EyeOff, Edit3, Save, RotateCcw, ChevronLeft, ChevronRight, CalendarDays, List } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import type { UtilityTask } from '@/types';
import type { CardConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const taskTypes: UtilityTask['type'][] = ['Sump Cleaning', 'Drainage', 'Electrical', 'Pest Control', 'Fire Safety'];

const RECURRENCE_OPTIONS: UtilityTask['recurrence'][] = [
  'One Time',
  'Monthly',
  'Quarterly (90 days)',
  'Half-Yearly (180 days)',
  'Yearly',
  'Every 2 Years',
  'Every 3 Years',
];

const RECURRENCE_DAYS: Record<string, number> = {
  'Monthly': 30,
  'Quarterly (90 days)': 90,
  'Half-Yearly (180 days)': 180,
  'Yearly': 365,
  'Every 2 Years': 730,
  'Every 3 Years': 1095,
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function calcNextDue(completedDate: string, recurrence: UtilityTask['recurrence']): string | undefined {
  if (!recurrence || recurrence === 'One Time') return undefined;
  const days = RECURRENCE_DAYS[recurrence];
  if (!days) return undefined;
  return addDays(completedDate, days);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// ─── Calendar helpers ──────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface CalendarDay {
  date: number;
  fullDate: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isWeekend: boolean;
  tasks: UtilityTask[];
}

function buildCalendarGrid(year: number, month: number, tasks: UtilityTask[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: CalendarDay[] = [];

  // Pad leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = month - 1 < 0 ? 11 : month - 1;
    const y = month - 1 < 0 ? year - 1 : year;
    const fullDate = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = new Date(y, m, d).getDay();
    cells.push({ date: d, fullDate, isCurrentMonth: false, isWeekend: dow === 0 || dow === 6, tasks: [] });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = new Date(year, month, d).getDay();
    const dayTasks = tasks.filter(t => t.scheduledDate === fullDate);
    cells.push({ date: d, fullDate, isCurrentMonth: true, isWeekend: dow === 0 || dow === 6, tasks: dayTasks });
  }

  // Pad trailing days from next month
  const remaining = 42 - cells.length; // always 6 rows x 7 cols
  for (let d = 1; d <= remaining; d++) {
    const m = month + 1 > 11 ? 0 : month + 1;
    const y = month + 1 > 11 ? year + 1 : year;
    const fullDate = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = new Date(y, m, d).getDay();
    cells.push({ date: d, fullDate, isCurrentMonth: false, isWeekend: dow === 0 || dow === 6, tasks: [] });
  }

  return cells;
}

// ─── Calendar Component ────────────────────────────────────────────────────────

interface CalendarViewProps {
  tasks: UtilityTask[];
}

function CalendarView({ tasks }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const todayStr = today.toISOString().split('T')[0];

  const grid = buildCalendarGrid(viewYear, viewMonth, tasks);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Close popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupDate(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDotColor = (cell: CalendarDay): string | null => {
    if (!cell.isCurrentMonth || cell.tasks.length === 0) return null;
    const hasOverdue = cell.tasks.some(t => t.status === 'Overdue');
    return hasOverdue ? 'bg-red-500' : 'bg-blue-500';
  };

  const popupTasks = popupDate ? tasks.filter(t => t.scheduledDate === popupDate) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-base font-semibold font-[Outfit] text-slate-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(label => (
          <div
            key={label}
            className={cn(
              'text-center text-xs font-semibold py-1',
              label === 'Sun' || label === 'Sat' ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 relative" ref={popupRef}>
        {grid.map((cell, idx) => {
          const dotColor = getDotColor(cell);
          const isToday = cell.fullDate === todayStr && cell.isCurrentMonth;
          const isSelected = cell.fullDate === popupDate;

          return (
            <div
              key={idx}
              onClick={() => {
                if (cell.tasks.length > 0) {
                  setPopupDate(prev => (prev === cell.fullDate ? null : cell.fullDate));
                } else {
                  setPopupDate(null);
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-start py-1.5 rounded-lg min-h-[52px]',
                cell.isCurrentMonth ? 'cursor-default' : 'opacity-30',
                cell.isWeekend && cell.isCurrentMonth ? 'bg-slate-50' : '',
                isSelected ? 'ring-2 ring-indigo-400' : '',
                cell.tasks.length > 0 && cell.isCurrentMonth ? 'cursor-pointer hover:bg-slate-100' : '',
              )}
            >
              {/* Weekend label */}
              {cell.isWeekend && cell.isCurrentMonth && (
                <span className="text-[9px] text-slate-300 leading-none mb-0.5">Holiday</span>
              )}

              {/* Date number */}
              <span
                className={cn(
                  'text-sm font-medium leading-none',
                  isToday
                    ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                {cell.date}
              </span>

              {/* Task dot(s) */}
              {dotColor && (
                <span
                  className={cn(
                    'mt-1 w-5 h-5 rounded-sm flex items-center justify-center text-white text-[10px] font-bold',
                    dotColor
                  )}
                >
                  {cell.tasks.length}
                </span>
              )}
            </div>
          );
        })}

        {/* Popup */}
        <AnimatePresence>
          {popupDate && popupTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">{formatDate(popupDate)}</p>
                <button onClick={() => setPopupDate(null)} className="p-0.5 hover:bg-slate-100 rounded">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-2">
                {popupTasks.map(task => (
                  <div
                    key={task.id}
                    className={cn(
                      'rounded-lg px-2.5 py-2 border text-xs',
                      task.status === 'Overdue'
                        ? 'bg-red-50 border-red-200'
                        : task.status === 'Done'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                          task.status === 'Overdue'
                            ? 'bg-red-200 text-red-700'
                            : task.status === 'Done'
                            ? 'bg-green-200 text-green-700'
                            : 'bg-blue-200 text-blue-700'
                        )}
                      >
                        {task.status}
                      </span>
                      <span className="text-slate-500">{task.type}</span>
                    </div>
                    <p className="font-medium text-slate-800 leading-snug">{task.description}</p>
                    {task.assignedStaff && (
                      <p className="text-slate-500 mt-0.5">Staff: {task.assignedStaff}</p>
                    )}
                    {task.recurrence && task.recurrence !== 'One Time' && (
                      <p className="text-slate-500 mt-0.5">Recurrence: {task.recurrence}</p>
                    )}
                    {task.nextDue && (
                      <p className="text-indigo-600 font-medium mt-0.5">Next Due: {formatDate(task.nextDue)}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-blue-500 inline-block" />
          <span className="text-xs text-slate-500">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-red-500 inline-block" />
          <span className="text-xs text-slate-500">Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
          <span className="text-xs text-slate-500">Holiday</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UtilityManagement() {
  const { utilityTasks, addUtilityTask, markUtilityDone } = useAppStore();
  const { settings, updateCardOrder, resetPageSettings } = useUISettingsStore();
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [form, setForm] = useState({
    description: '',
    type: 'Sump Cleaning' as UtilityTask['type'],
    scheduledDate: '',
    assignedStaff: '',
    notes: '',
    recurrence: 'One Time' as UtilityTask['recurrence'],
  });

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

  const handleCardVisibilityToggle = (cardId: string) => {
    setLocalCards(prev => prev.map(card =>
      card.id === cardId ? { ...card, visible: !card.visible } : card
    ));
    setHasChanges(true);
  };

  const handleCardReorder = (newOrder: CardConfig[]) => {
    const updatedCards = newOrder.map((card, index) => ({ ...card, order: index }));
    setLocalCards(updatedCards);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateCardOrder('utilityManagement', localCards);
    setIsEditMode(false);
    setHasChanges(false);
    toast.success('Layout settings saved!');
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setHasChanges(false);
  };

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
    if (!form.description || !form.scheduledDate || !form.assignedStaff) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await addUtilityTask({
        ...form,
        id: `U${Date.now()}`,
        status: 'Upcoming',
        recurrence: form.recurrence,
      });
      toast.success('Utility task added');
      setShowModal(false);
      setForm({ description: '', type: 'Sump Cleaning', scheduledDate: '', assignedStaff: '', notes: '', recurrence: 'One Time' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add utility task');
    }
  };

  const handleMarkDone = async (task: UtilityTask) => {
    try {
      await markUtilityDone(task.id);
      toast.success('Task marked as done');
      // nextDue is handled server-side or shown via local state; if recurrence present, show info
      if (task.recurrence && task.recurrence !== 'One Time') {
        const today = new Date().toISOString().split('T')[0];
        const nextDue = calcNextDue(today, task.recurrence);
        if (nextDue) toast.info(`Next due: ${formatDate(nextDue)}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not mark task done');
    }
  };

  const upcoming = filtered.filter(t => t.status === 'Upcoming').length;
  const overdue = filtered.filter(t => t.status === 'Overdue').length;
  const done = filtered.filter(t => t.status === 'Done').length;

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

      {/* Stat Cards */}
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

      {/* Toolbar: Filter + Tabs + Add */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
          </div>

          {activeTab === 'list' && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <CalendarView tasks={utilityTasks} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "grid grid-cols-1 gap-4",
              isEditMode && "ring-2 ring-indigo-400 ring-offset-2 rounded-2xl p-2"
            )}
          >
            {filtered.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-5 card-hover shadow-sm ${statusColor[task.status] || ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StatusBadge status={task.status} />
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                        {task.type}
                      </span>
                      {task.recurrence && task.recurrence !== 'One Time' && (
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-medium border border-indigo-100">
                          {task.recurrence}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-900 font-[Outfit]">{task.description}</h4>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                      <span>
                        Scheduled:{' '}
                        <span className="text-slate-700 font-medium">{task.scheduledDate}</span>
                      </span>
                      {task.lastCompleted && (
                        <span>
                          Last Done:{' '}
                          <span className="text-slate-700 font-medium">{task.lastCompleted}</span>
                        </span>
                      )}
                      <span>
                        Assigned:{' '}
                        <span className="text-slate-700 font-medium">{task.assignedStaff}</span>
                      </span>
                    </div>
                    {task.status === 'Done' && task.nextDue && (
                      <p className="text-xs text-indigo-600 font-medium mt-2">
                        Next Due: {formatDate(task.nextDue)}
                      </p>
                    )}
                    {task.notes && (
                      <p className="text-xs text-slate-400 mt-2 italic">{task.notes}</p>
                    )}
                  </div>
                  {task.status !== 'Done' && (
                    <button
                      onClick={() => handleMarkDone(task)}
                      className="flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
              title="Edit Layout"
              aria-label="Edit Layout"
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <Edit3 className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Add Utility Task</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as UtilityTask['type'] }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Scheduled Date</label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Recurrence</label>
                <select
                  value={form.recurrence}
                  onChange={e => setForm(f => ({ ...f, recurrence: e.target.value as UtilityTask['recurrence'] }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {RECURRENCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Assigned Staff</label>
                <input
                  value={form.assignedStaff}
                  onChange={e => setForm(f => ({ ...f, assignedStaff: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
