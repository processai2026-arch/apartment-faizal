import { useEffect, useState } from 'react';
import {
  Home, Plus, RefreshCw, Wifi, WifiOff, Edit, Trash2, Power,
  Lightbulb, ToggleLeft, Gauge, Eye, EyeOff, PlugZap, Server,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/features/DataTable';
import type { Column } from '@/components/features/DataTable';
import { useHomeAutomationStore } from '@/stores/useHomeAutomationStore';
import type { HomeAutomationHub, HomeAutomationDevice } from '@/types';
import { useToast } from '@/hooks/use-toast';

const COMMANDABLE = new Set(['light', 'switch', 'climate', 'cover', 'lock']);

function domainIcon(domain: string) {
  switch (domain) {
    case 'light': return <Lightbulb className="h-4 w-4" />;
    case 'switch': return <ToggleLeft className="h-4 w-4" />;
    case 'sensor':
    case 'binary_sensor': return <Gauge className="h-4 w-4" />;
    default: return <PlugZap className="h-4 w-4" />;
  }
}

function isOn(state?: string | null) {
  return state === 'on' || state === 'open' || state === 'unlocked' || state === 'heat' || state === 'cool';
}

function emptyForm(): Partial<HomeAutomationHub> & { accessToken?: string } {
  return { name: '', baseUrl: '', accessToken: '', status: 'Active', notes: '' };
}

export default function HomeAutomation() {
  const {
    hubs, devices, summary, loading, devicesLoading,
    loadHubs, loadSummary, createHub, updateHub, removeHub,
    checkHealth, syncDevices, loadDevices, updateDevice, command,
  } = useHomeAutomationStore();
  const { toast } = useToast();

  const [selectedHub, setSelectedHub] = useState<HomeAutomationHub | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HomeAutomationHub | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [busyEntity, setBusyEntity] = useState<string | null>(null);

  useEffect(() => {
    loadHubs();
    loadSummary();
  }, [loadHubs, loadSummary]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (hub: HomeAutomationHub) => {
    setEditing(hub);
    setForm({ name: hub.name, baseUrl: hub.baseUrl, accessToken: '', status: hub.status, notes: hub.notes ?? '' });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name || !form.baseUrl || (!editing && !form.accessToken)) {
      toast({ title: 'Missing fields', description: 'Name, base URL, and (for new hubs) an access token are required.', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updateHub(editing.id, form);
        toast({ title: 'Hub updated' });
      } else {
        await createHub(form);
        toast({ title: 'Hub added' });
      }
      setDialogOpen(false);
      loadSummary();
    } catch (e) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    }
  };

  const onHealth = async (hub: HomeAutomationHub) => {
    try {
      const ok = await checkHealth(hub.id);
      toast({ title: ok ? 'Hub reachable' : 'Hub unreachable', variant: ok ? 'default' : 'destructive' });
      loadSummary();
    } catch (e) {
      toast({ title: 'Check failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    }
  };

  const onSync = async (hub: HomeAutomationHub) => {
    try {
      const res = await syncDevices(hub.id);
      setSelectedHub(hub);
      toast({ title: 'Devices synced', description: `${res.imported} new, ${res.total} total.` });
      loadSummary();
    } catch (e) {
      toast({ title: 'Sync failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    }
  };

  const onSelect = (hub: HomeAutomationHub) => { setSelectedHub(hub); loadDevices(hub.id); };

  const onDelete = async (hub: HomeAutomationHub) => {
    if (!confirm(`Remove hub "${hub.name}"? Registered devices are removed too.`)) return;
    await removeHub(hub.id);
    if (selectedHub?.id === hub.id) setSelectedHub(null);
    toast({ title: 'Hub removed' });
    loadSummary();
  };

  const sendCommand = async (device: HomeAutomationDevice, service: string) => {
    if (!selectedHub) return;
    setBusyEntity(device.entityId);
    try {
      await command(selectedHub.id, device.entityId, service);
      toast({ title: 'Command sent', description: `${device.friendlyName ?? device.entityId} → ${service}` });
    } catch (e) {
      toast({ title: 'Command failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    } finally {
      setBusyEntity(null);
    }
  };

  const hubColumns: Column<HomeAutomationHub>[] = [
    {
      key: 'name', label: 'Hub',
      render: (h) => (
        <button className="text-left font-medium hover:underline" onClick={() => onSelect(h)}>
          <div className="flex items-center gap-2"><Server className="h-4 w-4 text-muted-foreground" />{h.name}</div>
          <div className="text-xs text-muted-foreground">{h.baseUrl}</div>
        </button>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (h) => <Badge variant={h.status === 'Active' ? 'default' : 'secondary'}>{h.status}</Badge>,
    },
    {
      key: 'reachability', label: 'Reachability',
      render: (h) => h.lastCheckOk == null
        ? <span className="text-xs text-muted-foreground">never checked</span>
        : h.lastCheckOk === 1
          ? <span className="flex items-center gap-1 text-xs text-green-600"><Wifi className="h-3 w-3" /> reachable</span>
          : <span className="flex items-center gap-1 text-xs text-red-600"><WifiOff className="h-3 w-3" /> unreachable</span>,
    },
    {
      key: 'actions', label: '', className: 'text-right',
      render: (h) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" title="Health check" onClick={() => onHealth(h)}><Wifi className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" title="Sync devices" onClick={() => onSync(h)}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(h)}><Edit className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" title="Remove" onClick={() => onDelete(h)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Home className="h-6 w-6" /> Home Automation</h1>
          <p className="text-sm text-muted-foreground">Connect client Home Assistant hubs and control their devices.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Hub</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Hubs', value: summary.hubs, icon: <Server className="h-4 w-4" /> },
            { label: 'Active', value: summary.activeHubs, icon: <Power className="h-4 w-4" /> },
            { label: 'Reachable', value: summary.reachableHubs, icon: <Wifi className="h-4 w-4" /> },
            { label: 'Devices', value: summary.devices, icon: <PlugZap className="h-4 w-4" /> },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
                <div className="text-muted-foreground">{s.icon}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Hubs</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            data={hubs}
            columns={hubColumns}
            searchKeys={['name', 'baseUrl']}
            empty={loading ? 'Loading hubs…' : "No hubs yet. Add a client's Home Assistant hub to begin."}
          />
        </CardContent>
      </Card>

      {selectedHub && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Devices — {selectedHub.name}</span>
              <Button size="sm" variant="outline" onClick={() => onSync(selectedHub)}><RefreshCw className="mr-1 h-4 w-4" /> Re-sync</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <p className="text-sm text-muted-foreground">Loading devices…</p>
            ) : devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No devices registered. Use “Sync devices” to import entities from Home Assistant.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((d) => {
                  const commandable = COMMANDABLE.has(d.domain) && d.isControllable === 1;
                  const on = isOn(d.state);
                  return (
                    <div key={d.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={on ? 'text-amber-500' : 'text-muted-foreground'}>{domainIcon(d.domain)}</span>
                          <div>
                            <div className="text-sm font-medium">{d.friendlyName ?? d.entityId}</div>
                            <div className="text-xs text-muted-foreground">{d.entityId}</div>
                          </div>
                        </div>
                        <Button
                          size="sm" variant="ghost" title={d.visibleToOwner === 1 ? 'Visible to client' : 'Hidden from client'}
                          onClick={() => updateDevice(d.id, { visibleToOwner: d.visibleToOwner !== 1 })}
                        >
                          {d.visibleToOwner === 1 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm">
                          {d.reachable
                            ? <span className={on ? 'font-semibold text-green-600' : ''}>{d.state ?? '—'}{d.unit ? ` ${d.unit}` : ''}</span>
                            : <span className="text-xs text-red-500">offline</span>}
                        </div>
                        {commandable && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" disabled={busyEntity === d.entityId} onClick={() => sendCommand(d, 'turn_on')}>On</Button>
                            <Button size="sm" variant="outline" disabled={busyEntity === d.entityId} onClick={() => sendCommand(d, 'turn_off')}>Off</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Hub' : 'Add Home Assistant Hub'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client home / building" /></div>
            <div><Label>Base URL</Label><Input value={form.baseUrl ?? ''} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://xxxx.ui.nabu.casa" /></div>
            <div>
              <Label>Long-lived access token {editing && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
              <Input type="password" value={form.accessToken ?? ''} onChange={(e) => setForm({ ...form, accessToken: e.target.value })} placeholder={editing ? '••••••' : 'HA long-lived token'} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as HomeAutomationHub['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Disabled">Disabled</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? 'Save' : 'Add Hub'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
