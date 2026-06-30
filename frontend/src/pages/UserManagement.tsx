import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, Shield, Users, KeyRound, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import DataTable, { NameCell, type Column } from '@/components/features/DataTable';
import TableToolbar from '@/components/features/TableToolbar';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { api } from '@/lib/api';
import type { ManagedUser } from '@/types/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Role = 'security' | 'tenant';
type TabKey = 'security' | 'tenant';

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'security' as Role, status: 'active' as 'active' | 'inactive' };

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('security');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api.users.list());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const byTab = users.filter(u => u.role === activeTab);
    if (!search) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(u => [u.name, u.email, u.phone].some(f => String(f ?? '').toLowerCase().includes(q)));
  }, [users, activeTab, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, role: activeTab });
    setShowModal(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone ?? '', password: '', role: u.role, status: u.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    if (!editing && form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (editing && form.password && form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setSaving(true);
    try {
      if (editing) {
        const updated = await api.users.update(editing.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        });
        setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
        toast.success('User updated');
      } else {
        const created = await api.users.create({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          role: form.role,
        });
        setUsers(prev => [...prev, created]);
        toast.success(`${form.role === 'security' ? 'Security' : 'Tenant'} account created`);
      }
      setShowModal(false);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.users.remove(deleting.id);
      setUsers(prev => prev.filter(u => u.id !== deleting.id));
      toast.success('User deleted');
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete user');
    }
  };

  const columns: Column<ManagedUser>[] = [
    { key: 'name', label: 'User', render: (u) => <NameCell name={u.name} subtitle={u.email} color={u.role === 'security' ? 'amber' : 'blue'} /> },
    { key: 'phone', label: 'Phone', render: (u) => u.phone || <span className="text-slate-400">—</span> },
    { key: 'status', label: 'Status', render: (u) => <StatusBadge status={u.status === 'active' ? 'Active' : 'Inactive'} /> },
    { key: 'createdAt', label: 'Created', render: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
  ];

  const tabMeta: Record<TabKey, { label: string; icon: typeof Shield; count: number }> = {
    security: { label: 'Security', icon: Shield, count: users.filter(u => u.role === 'security').length },
    tenant: { label: 'Tenant', icon: Users, count: users.filter(u => u.role === 'tenant').length },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">User Management</h1>
        <p className="text-sm text-slate-500">Create and manage Security & Tenant login accounts.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <TableToolbar
            title={
              <div className="flex bg-slate-100 rounded-xl p-1">
                {(Object.keys(tabMeta) as TabKey[]).map(key => {
                  const TabIcon = tabMeta[key].icon;
                  return (
                    <button key={key} onClick={() => setActiveTab(key)}
                      className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        activeTab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
                      <TabIcon className="w-4 h-4" /> {tabMeta[key].label}
                      <span className={cn('px-1.5 rounded text-xs', activeTab === key ? 'bg-white/20' : 'bg-slate-200')}>{tabMeta[key].count}</span>
                    </button>
                  );
                })}
              </div>
            }
            filters={<SearchInput value={search} onChange={setSearch} placeholder="Search users..." />}
            actions={
              <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> Add {activeTab === 'security' ? 'Security' : 'Tenant'}
              </button>
            }
          />
        </div>

        <DataTable
          data={(loading ? [] : filtered) as unknown as Record<string, unknown>[]}
          columns={columns as never[]}
          hideSearch
          rowId={(u) => (u as unknown as ManagedUser).id}
          empty={
            <EmptyState
              icon={activeTab === 'security' ? Shield : Users}
              title={loading ? 'Loading users…' : `No ${activeTab} accounts yet`}
              description={loading ? undefined : (search ? 'No users match your search.' : `Create a ${activeTab} login so they can sign in.`)}
              action={loading || search ? undefined : { label: `Add ${activeTab === 'security' ? 'Security' : 'Tenant'}`, icon: Plus, onClick: openAdd }}
            />
          }
          actions={(u: unknown) => {
            const user = u as ManagedUser;
            return (
              <>
                <button onClick={() => openEdit(user)} title="Edit / reset password" className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleting(user)} title="Delete" className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            );
          }}
        />
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">{editing ? 'Edit User' : `Add ${form.role === 'security' ? 'Security' : 'Tenant'} Account`}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              {!editing && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Role</label>
                  <div className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-700 flex items-center gap-2">
                    {form.role === 'security' ? <Shield className="w-4 h-4 text-amber-600" /> : <Users className="w-4 h-4 text-blue-600" />}
                    {form.role === 'security' ? 'Security' : 'Tenant'}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ramu Kumar"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Email (login)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Phone (optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91XXXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  {editing ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {editing && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (cannot log in)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} disabled={saving} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold font-[Outfit] text-slate-900">Delete User</h3>
                <p className="text-sm text-slate-500">This account can no longer log in.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">Delete <span className="font-semibold text-slate-900">{deleting.name}</span> ({deleting.email})?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
