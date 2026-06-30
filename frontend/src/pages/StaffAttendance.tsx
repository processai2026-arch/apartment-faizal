import { useState, useEffect } from 'react';
import { Download, Check, Eye, EyeOff, Edit3, Save, RotateCcw, X, UserPlus, Pencil, Trash2, Phone, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import type { Staff } from '@/types';
import type { CardConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AttStatus = 'P' | 'A' | 'H';
const statusLabels = { P: 'Present', A: 'Absent', H: 'Half-Day' };
const statusColors = {
  P: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  A: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  H: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
};

type StaffRole = Staff['role'];
const ROLES: StaffRole[] = ['Security', 'Housekeeping', 'Electrician', 'Plumber', 'Gardener', 'Driver', 'Receptionist', 'Maintenance'];

const emptyForm = { name: '', role: 'Security' as StaffRole, department: '', contact: '', joinDate: new Date().toISOString().split('T')[0] };

export default function StaffAttendance() {
  const { staff, updateStaffAttendance, addStaff, updateStaff, removeStaff } = useAppStore();
  const { settings, updateCardOrder, resetPageSettings } = useUISettingsStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>(() => {
    const init: Record<string, AttStatus> = {};
    staff.forEach(s => {
      const a = s.attendance?.[selectedDate];
      init[s.id] = (a as AttStatus) || 'P';
    });
    return init;
  });

  // Page tab: attendance vs manage
  const [pageTab, setPageTab] = useState<'attendance' | 'manage'>('attendance');

  // Staff modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => { setEditingStaff(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Staff) => { setEditingStaff(s); setForm({ name: s.name, role: s.role, department: s.department, contact: s.contact, joinDate: s.joinDate }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.contact.trim()) { toast.error('Name and contact are required'); return; }
    try {
      if (editingStaff) {
        await updateStaff({ ...editingStaff, ...form });
        toast.success('Staff updated successfully');
      } else {
        await addStaff({ id: `S${Date.now()}`, ...form, attendance: {} });
        toast.success('Staff member added');
      }
      setShowModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save staff');
    }
  };

  const handleDelete = (id: string) => { removeStaff(id); setDeleteConfirm(null); toast.success('Staff member removed'); };

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localCards, setLocalCards] = useState<CardConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.staffAttendance || { cards: [], columns: [], buttons: [], sections: [] };

  // Default cards if none configured
  const defaultCards: CardConfig[] = [
    { id: 'presentToday', title: 'Present', visible: true, order: 0, size: 'small', collapsed: false },
    { id: 'absentToday', title: 'Absent', visible: true, order: 1, size: 'small', collapsed: false },
    { id: 'halfDay', title: 'Half-Day', visible: true, order: 2, size: 'small', collapsed: false },
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

  // Save layout changes
  const handleSaveLayout = () => {
    updateCardOrder('staffAttendance', localCards);
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
    resetPageSettings('staffAttendance');
    setLocalCards(defaultCards);
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const handleChange = (staffId: string, status: AttStatus) => {
    setAttendance(prev => ({ ...prev, [staffId]: status }));
  };

  const handleSubmit = async () => {
    try {
      await Promise.all(Object.entries(attendance).map(([staffId, status]) => updateStaffAttendance(staffId, selectedDate, status)));
      toast.success(`Attendance submitted for ${selectedDate}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit attendance');
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'P').length;
  const absentCount = Object.values(attendance).filter(s => s === 'A').length;
  const halfCount = Object.values(attendance).filter(s => s === 'H').length;

  // Get ordered cards for display
  const orderedCards = isEditMode 
    ? localCards 
    : (pageSettings.cards.length > 0 
        ? [...pageSettings.cards].sort((a, b) => a.order - b.order)
        : defaultCards);

  const cardData: Record<string, { count: number; cls: string }> = {
    presentToday: { count: presentCount, cls: 'text-green-600 bg-green-50' },
    absentToday: { count: absentCount, cls: 'text-red-600 bg-red-50' },
    halfDay: { count: halfCount, cls: 'text-amber-600 bg-amber-50' },
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
              onClick={handleSaveLayout}
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

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tab Toggle */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setPageTab('attendance')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              pageTab === 'attendance' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700')}
          >
            <Check className="w-4 h-4" /> Attendance
          </button>
          <button
            onClick={() => setPageTab('manage')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              pageTab === 'manage' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700')}
          >
            <Users className="w-4 h-4" /> Manage Staff
            <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{staff.length}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {pageTab === 'attendance' && (
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          {pageTab === 'manage' && (
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" /> Add Staff
            </button>
          )}
          {pageTab === 'attendance' && (
            <button onClick={() => toast.info('Export coming soon')}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          )}
        </div>
      </div>

      {/* ── MANAGE STAFF TAB ── */}
      {pageTab === 'manage' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold font-[Outfit]">All Staff Members</h3>
            <span className="text-xs text-slate-400">{staff.length} members</span>
          </div>
          <div className="divide-y divide-slate-50">
            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.role} • {s.department}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{s.contact}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />Since {s.joinDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  {deleteConfirm === s.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => handleDelete(s.id)}
                        className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(s.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No staff members yet. Click <strong>Add Staff</strong> to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {pageTab === 'attendance' && (<>

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

      <div className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden",
        isEditMode && "ring-2 ring-indigo-400 ring-offset-2"
      )}>
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-base font-semibold font-[Outfit]">Mark Attendance — {selectedDate}</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {staff.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">{s.name[0]}</div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.role} • {s.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(['P', 'A', 'H'] as AttStatus[]).map(status => (
                  <button key={status} onClick={() => handleChange(s.id, status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${attendance[s.id] === status ? statusColors[status] : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button onClick={handleSubmit}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Check className="w-4 h-4" /> Submit Attendance
          </button>
        </div>
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
              title="Edit Layout"
              aria-label="Edit Layout"
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <Edit3 className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      </>)}

      {/* ── ADD / EDIT STAFF MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 font-[Outfit]">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ramu Kumar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as StaffRole }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. Security"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                <input type="tel" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="+91 99999 00000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Date</label>
                <input type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.contact.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {editingStaff ? 'Save Changes' : 'Add Staff'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
