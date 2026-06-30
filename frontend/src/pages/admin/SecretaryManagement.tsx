import { useEffect, useState } from 'react';
import { UserCog, Plus, Trash2, Settings2, Pencil } from 'lucide-react';
import DataTable, { Column } from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSecretaryStore } from '@/stores/useSecretaryStore';
import type { SecretaryUser, SecretaryPermission } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const ALL_MODULES: { id: string; label: string }[] = [
  { id: 'complaints', label: 'Complaint Management' },
  { id: 'maintenance', label: 'Maintenance Requests' },
  { id: 'visitors', label: 'Visitor Management' },
  { id: 'vendors', label: 'Vendor Marketplace' },
  { id: 'rentals', label: 'Rental Marketplace' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'emergency_contacts', label: 'Emergency Contacts' },
  { id: 'daily_workers', label: 'Daily Workers' },
  { id: 'reports', label: 'Reports' },
  { id: 'payments', label: 'Financial / Payments' },
  { id: 'occupancy', label: 'Offices / Occupancy' },
];

type PermissionMap = Record<string, { canView: boolean; canEdit: boolean }>;

function buildPermMap(permissions?: SecretaryPermission[]): PermissionMap {
  const map: PermissionMap = {};
  ALL_MODULES.forEach((m) => {
    map[m.id] = { canView: false, canEdit: false };
  });
  if (permissions) {
    permissions.forEach((p) => {
      map[p.module] = { canView: p.canView, canEdit: p.canEdit };
    });
  }
  return map;
}

function permMapToArray(map: PermissionMap): SecretaryPermission[] {
  return ALL_MODULES
    .filter((m) => map[m.id]?.canView || map[m.id]?.canEdit)
    .map((m) => ({
      module: m.id,
      canView: map[m.id]?.canView ?? false,
      canEdit: map[m.id]?.canEdit ?? false,
    }));
}

export default function SecretaryManagement() {
  const { secretaries, loading, loadSecretaries, createSecretary, updateSecretary, setPermissions, removeSecretary } = useSecretaryStore();
  const { toast } = useToast();

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SecretaryUser | null>(null);
  const [selected, setSelected] = useState<SecretaryUser | null>(null);

  // ── Form: create secretary ────────────────────────────────────────────────
  const [createMode, setCreateMode] = useState<'new' | 'existing'>('new');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', userId: '' });
  const [saving, setSaving] = useState(false);

  // ── Permission editing ────────────────────────────────────────────────────
  const [permMap, setPermMap] = useState<PermissionMap>(buildPermMap([]));

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', status: 'active' });

  useEffect(() => {
    loadSecretaries();
  }, [loadSecretaries]);

  // ── Open permissions dialog ───────────────────────────────────────────────
  const openPermissions = (sec: SecretaryUser) => {
    setSelected(sec);
    setPermMap(buildPermMap(sec.permissions));
    setShowPermissions(true);
  };

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const openEdit = (sec: SecretaryUser) => {
    setSelected(sec);
    setEditForm({ name: sec.name, email: sec.email, phone: sec.phone ?? '', status: sec.status });
    setShowEdit(true);
  };

  // ── Create secretary ──────────────────────────────────────────────────────
  const handleCreate = async () => {
    setSaving(true);
    try {
      if (createMode === 'existing') {
        if (!form.userId.trim()) {
          toast({ title: 'User ID is required', variant: 'destructive' });
          return;
        }
        await createSecretary({ user_id: Number(form.userId) });
      } else {
        if (!form.name || !form.email || !form.password) {
          toast({ title: 'Name, email and password are required', variant: 'destructive' });
          return;
        }
        await createSecretary({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        });
      }
      toast({ title: 'Secretary created successfully' });
      setShowCreate(false);
      setForm({ name: '', email: '', phone: '', password: '', userId: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create secretary';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Save permissions ──────────────────────────────────────────────────────
  const handleSavePermissions = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await setPermissions(String(selected.id), permMapToArray(permMap));
      toast({ title: 'Permissions updated' });
      setShowPermissions(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update permissions';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateSecretary(String(selected.id), {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || undefined,
        status: editForm.status,
      });
      toast({ title: 'Secretary updated' });
      setShowEdit(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update secretary';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete secretary ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await removeSecretary(String(deleteTarget.id));
      toast({ title: 'Secretary role removed' });
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove secretary';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: Column<SecretaryUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (s) => s.phone ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'modules',
      label: 'Modules',
      render: (s) => (
        <span className="text-xs text-slate-500">
          {s.modules && s.modules.length > 0
            ? `${s.modules.length} module${s.modules.length !== 1 ? 's' : ''}`
            : 'None assigned'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added',
      render: (s) => (
        <span className="text-xs text-slate-500">
          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <UserCog className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Secretary Management</h1>
            <p className="text-slate-500 text-sm">Manage secretary accounts and module permissions</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Secretary
        </Button>
      </div>

      {/* Table */}
      <DataTable<SecretaryUser>
        data={secretaries}
        columns={columns}
        searchKeys={['name', 'email']}
        searchPlaceholder="Search secretaries..."
        rowId={(s) => String(s.id)}
        actions={(s) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(s)}
              title="Edit secretary"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPermissions(s)}
              title="Edit permissions"
            >
              <Settings2 className="h-4 w-4 text-indigo-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(s)}
              title="Remove secretary role"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Secretary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                variant={createMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateMode('new')}
              >
                New User
              </Button>
              <Button
                variant={createMode === 'existing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCreateMode('existing')}
              >
                Existing Admin
              </Button>
            </div>

            {createMode === 'existing' ? (
              <div className="space-y-2">
                <Label htmlFor="userId">Admin User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter existing admin user ID"
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                />
                <p className="text-xs text-slate-500">
                  The user must already have the admin role.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="secName">Full Name *</Label>
                  <Input
                    id="secName"
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secEmail">Email *</Label>
                  <Input
                    id="secEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secPhone">Phone</Label>
                  <Input
                    id="secPhone"
                    placeholder="+60123456789"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secPassword">Password *</Label>
                  <Input
                    id="secPassword"
                    type="password"
                    placeholder="Min 10 characters"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Secretary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Secretary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <select
                id="editStatus"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Module Permissions — {selected?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-3 gap-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">
              <span>Module</span>
              <span className="text-center">View</span>
              <span className="text-center">Edit</span>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {ALL_MODULES.map((mod) => {
                const perm = permMap[mod.id] ?? { canView: false, canEdit: false };
                return (
                  <div
                    key={mod.id}
                    className="grid grid-cols-3 gap-x-2 items-center px-1 py-2 rounded-lg hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-700">{mod.label}</span>
                    <div className="flex justify-center">
                      <Checkbox
                        id={`view-${mod.id}`}
                        checked={perm.canView}
                        onCheckedChange={(checked) => {
                          setPermMap((prev) => ({
                            ...prev,
                            [mod.id]: {
                              canView: !!checked,
                              canEdit: !!checked ? prev[mod.id]?.canEdit ?? false : false,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Checkbox
                        id={`edit-${mod.id}`}
                        checked={perm.canEdit}
                        disabled={!perm.canView}
                        onCheckedChange={(checked) => {
                          setPermMap((prev) => ({
                            ...prev,
                            [mod.id]: { ...prev[mod.id], canEdit: !!checked },
                          }));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Edit permission requires View to be enabled first.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissions(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Secretary Role</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the secretary role from{' '}
              <strong>{deleteTarget?.name}</strong> and remove all their module permissions.
              The user account itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Removing...' : 'Remove Secretary'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
