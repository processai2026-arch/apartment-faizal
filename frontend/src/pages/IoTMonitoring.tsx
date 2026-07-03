import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cpu, Plus, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle,
  Edit, Trash2, KeyRound, Copy, Check, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/features/DataTable';
import type { Column } from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { useIotStore } from '@/stores/useIotStore';
import type { IotDevice, IotEvent, IotSeverity } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DEVICE_TYPES: { value: IotDevice['deviceType']; label: string }[] = [
  { value: 'lift', label: 'Lift' },
  { value: 'electrical_board', label: 'Electrical Board' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'other', label: 'Other' },
];
const PROTOCOLS: IotDevice['protocol'][] = ['http', 'mqtt', 'modbus'];
const EVENT_TYPES = ['fault', 'voltage_fluctuation', 'status_change', 'heartbeat', 'test'];
const SEVERITIES: IotSeverity[] = ['info', 'warning', 'critical'];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010';

function formatTime(ts?: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function deviceTypeLabel(value: string) {
  return DEVICE_TYPES.find((t) => t.value === value)?.label ?? value;
}

function SeverityBadge({ severity }: { severity: IotSeverity }) {
  const styles: Record<IotSeverity, string> = {
    info: 'bg-slate-100 text-slate-600',
    warning: 'bg-amber-50 text-amber-700',
    critical: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800">
        {value}
      </code>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 flex-shrink-0 px-2"
        title={label ?? 'Copy'}
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

// ── Token-once dialog ─────────────────────────────────────────────────────────

function TokenDialog({ token, deviceName, onClose }: { token: string | null; deviceName: string; onClose: () => void }) {
  return (
    <Dialog open={!!token} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            Device Token — shown only once
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-600">
            Copy this token now and flash it into the firmware of <strong>{deviceName}</strong>.
            It is stored server-side and cannot be viewed again — only regenerated.
          </p>
          {token && <CopyField value={token} label="Copy token" />}
          <p className="text-xs text-slate-500">
            The device must send it on every request as the <code className="rounded bg-slate-100 px-1">X-Device-Token</code> header.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>I have copied the token</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Device form dialog ────────────────────────────────────────────────────────

interface DeviceFormDialogProps {
  open: boolean;
  initial?: IotDevice | null;
  onClose: () => void;
  onCreated: (device: IotDevice) => void;
}

function DeviceFormDialog({ open, initial, onClose, onCreated }: DeviceFormDialogProps) {
  const { createDevice, updateDevice } = useIotStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    deviceType: 'lift' as IotDevice['deviceType'],
    protocol: 'http' as IotDevice['protocol'],
    ipAddress: '',
    ioLines: '',
    location: '',
    status: 'Active' as IotDevice['status'],
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        deviceType: initial?.deviceType ?? 'lift',
        protocol: initial?.protocol ?? 'http',
        ipAddress: initial?.ipAddress ?? '',
        ioLines: initial?.ioLines != null ? String(initial.ioLines) : '',
        location: initial?.location ?? '',
        status: initial?.status ?? 'Active',
        notes: initial?.notes ?? '',
      });
    }
  }, [open, initial]);

  function f(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Validation', description: 'Device name is required.', variant: 'destructive' });
      return;
    }
    const payload: Partial<IotDevice> = {
      name: form.name.trim(),
      deviceType: form.deviceType,
      protocol: form.protocol,
      ipAddress: form.ipAddress.trim() || undefined,
      ioLines: form.ioLines !== '' ? Number(form.ioLines) : undefined,
      location: form.location.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };
    setLoading(true);
    try {
      if (initial) {
        await updateDevice(initial.id, payload);
        toast({ title: 'Device updated' });
      } else {
        const created = await createDevice(payload);
        toast({ title: 'Device created' });
        onCreated(created);
      }
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to save device.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Device' : 'Add IoT Device'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={f('name')} placeholder="e.g. Lift 1 I/O Module" required />
            </div>
            <div className="space-y-1">
              <Label>Device Type</Label>
              <Select value={form.deviceType} onValueChange={(v) => setForm((p) => ({ ...p, deviceType: v as IotDevice['deviceType'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Protocol</Label>
              <Select value={form.protocol} onValueChange={(v) => setForm((p) => ({ ...p, protocol: v as IotDevice['protocol'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROTOCOLS.map((p) => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as IotDevice['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>IP Address (LAN)</Label>
              <Input value={form.ipAddress} onChange={f('ipAddress')} placeholder="192.168.1.50" />
            </div>
            <div className="space-y-1">
              <Label>I/O Lines</Label>
              <Input type="number" min={0} max={128} value={form.ioLines} onChange={f('ioLines')} placeholder="16–26" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Location</Label>
              <Input value={form.location} onChange={f('location')} placeholder="e.g. Lift machine room, Block A" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Wiring map, e.g. DI1 = lift fault contact, DI5 = phase-failure relay" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : (initial ? 'Update' : 'Create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IoTMonitoring() {
  const {
    devices, events, summary, loading, eventsLoading,
    loadDevices, loadEvents, loadSummary, removeDevice, regenerateToken, acknowledgeEvent,
  } = useIotStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('devices');
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<IotDevice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<IotDevice | null>(null);
  const [regenConfirm, setRegenConfirm] = useState<IotDevice | null>(null);
  const [shownToken, setShownToken] = useState<{ token: string; deviceName: string } | null>(null);
  const [eventsFilter, setEventsFilter] = useState({ deviceId: '', eventType: '', severity: '', acknowledged: '' });
  const eventsFilterRef = useRef(eventsFilter);
  eventsFilterRef.current = eventsFilter;

  const eventParams = useCallback((filter: typeof eventsFilter) => ({
    device_id: filter.deviceId || undefined,
    event_type: filter.eventType || undefined,
    severity: filter.severity || undefined,
    acknowledged: filter.acknowledged || undefined,
    perPage: '50',
  }), []);

  const refresh = useCallback(() => {
    void loadDevices();
    void loadSummary();
    void loadEvents(eventParams(eventsFilterRef.current));
  }, [loadDevices, loadSummary, loadEvents, eventParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reload events when filters change
  useEffect(() => {
    void loadEvents(eventParams(eventsFilter));
  }, [eventsFilter, loadEvents, eventParams]);

  // Auto-refresh every 30s while the page is mounted
  useEffect(() => {
    const id = setInterval(() => {
      void loadSummary();
      void loadEvents(eventParams(eventsFilterRef.current));
      void loadDevices();
    }, 30000);
    return () => clearInterval(id);
  }, [loadSummary, loadEvents, loadDevices, eventParams]);

  async function handleDelete(device: IotDevice) {
    try {
      await removeDevice(device.id);
      toast({ title: 'Device deleted' });
      setDeleteConfirm(null);
      void loadSummary();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  }

  async function handleRegenerate(device: IotDevice) {
    try {
      const token = await regenerateToken(device.id);
      setRegenConfirm(null);
      setShownToken({ token, deviceName: device.name });
    } catch {
      toast({ title: 'Token regeneration failed', variant: 'destructive' });
    }
  }

  async function handleAcknowledge(eventId: string) {
    try {
      await acknowledgeEvent(eventId);
      toast({ title: 'Alert acknowledged' });
    } catch {
      toast({ title: 'Failed to acknowledge', variant: 'destructive' });
    }
  }

  // ── Columns ─────────────────────────────────────────────────────────────────

  const deviceColumns: Column<IotDevice>[] = [
    { key: 'name', label: 'Name', render: (d) => <span className="font-medium">{d.name}</span> },
    { key: 'deviceType', label: 'Type', render: (d) => <span className="text-xs">{deviceTypeLabel(d.deviceType)}</span> },
    { key: 'protocol', label: 'Protocol', render: (d) => <Badge variant="outline" className="text-xs uppercase">{d.protocol}</Badge> },
    { key: 'ipAddress', label: 'IP (LAN)', render: (d) => <span className="font-mono text-xs">{d.ipAddress ?? '—'}</span> },
    { key: 'ioLines', label: 'I/O', render: (d) => <span className="text-xs">{d.ioLines ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (d) => <StatusBadge status={d.status} size="sm" /> },
    { key: 'lastSeenAt', label: 'Last Seen', render: (d) => <span className="text-xs">{formatTime(d.lastSeenAt)}</span> },
  ];

  const eventColumns: Column<IotEvent>[] = [
    { key: 'deviceName', label: 'Device', render: (e) => (
      <span className="text-xs">{e.deviceName ?? devices.find((d) => d.id === e.deviceId)?.name ?? `#${e.deviceId}`}</span>
    )},
    { key: 'eventType', label: 'Event', render: (e) => <span className="font-medium capitalize">{e.eventType.replace(/_/g, ' ')}</span> },
    { key: 'severity', label: 'Severity', render: (e) => <SeverityBadge severity={e.severity} /> },
    { key: 'ioLine', label: 'Line', render: (e) => <span className="text-xs">{e.ioLine ?? '—'}</span> },
    { key: 'message', label: 'Message', render: (e) => (
      <span className="block max-w-[260px] truncate text-xs text-slate-600" title={e.message}>{e.message ?? e.value ?? '—'}</span>
    )},
    { key: 'createdAt', label: 'Time', render: (e) => <span className="text-xs">{formatTime(e.createdAt)}</span> },
    { key: 'acknowledgedAt', label: 'Status', render: (e) => (
      e.acknowledgedAt
        ? <Badge variant="secondary" className="text-xs">Acknowledged</Badge>
        : e.severity === 'info'
          ? <span className="text-xs text-slate-400">—</span>
          : <Badge variant="outline" className="text-xs text-amber-600">Pending</Badge>
    )},
  ];

  const sampleCurl = `curl -X POST ${API_BASE}/iot/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Token: <your-device-token>" \\
  -d '{
    "event_type": "voltage_fluctuation",
    "severity": "critical",
    "io_line": 5,
    "value": "252.4",
    "message": "L1 over-voltage: 252.4V (limit 245V)",
    "payload": {"l1": 252.4, "l2": 231.0, "l3": 229.8, "unit": "V"}
  }'`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">IoT Monitoring</h1>
            <p className="text-sm text-slate-500">Automated fault detection — lifts, electrical boards & facility hardware</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditDevice(null); setFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />Add Device
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Devices</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{summary?.totalDevices ?? devices.length}</p>
              </div>
              <Cpu className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Online</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{summary?.onlineDevices ?? 0}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Offline &gt;{summary?.offlineThresholdMinutes ?? 10}m</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{summary?.offlineCount ?? 0}</p>
              </div>
              <WifiOff className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unack. Alerts</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{summary?.unacknowledgedAlerts ?? 0}</p>
                {summary && summary.unacknowledgedCritical > 0 && (
                  <p className="text-xs font-medium text-red-600">{summary.unacknowledgedCritical} critical</p>
                )}
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        {/* ── Tab: Devices ──────────────────────────────────────────────────── */}
        <TabsContent value="devices">
          <Card>
            <CardContent className="pt-4">
              <DataTable
                data={devices}
                columns={deviceColumns}
                searchKeys={['name', 'location', 'ipAddress'] as (keyof IotDevice)[]}
                searchPlaceholder="Search devices..."
                actions={(device) => (
                  <div className="flex gap-1">
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => setRegenConfirm(device)}
                      title="Regenerate device token"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => { setEditDevice(device); setFormOpen(true); }}
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5 text-indigo-500" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2"
                      onClick={() => setDeleteConfirm(device)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Events ───────────────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-4">
              <Select value={eventsFilter.deviceId || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, deviceId: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All devices" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All devices</SelectItem>
                  {devices.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventsFilter.eventType || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, eventType: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All event types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All event types</SelectItem>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventsFilter.severity || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, severity: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All severities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventsFilter.acknowledged || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, acknowledged: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Any status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="pending">Pending only</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged only</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                <Activity className="h-3.5 w-3.5" />
                auto-refreshes every 30s
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <DataTable
                data={events}
                columns={eventColumns}
                pageSize={15}
                empty={<p className="py-6 text-center text-sm text-slate-400">{eventsLoading ? 'Loading…' : 'No events recorded yet.'}</p>}
                actions={(ev) => (
                  !ev.acknowledgedAt && ev.severity !== 'info' ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAcknowledge(ev.id)}>
                      <CheckCircle className="mr-1 h-3 w-3" />Acknowledge
                    </Button>
                  ) : null
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Setup Guide ──────────────────────────────────────────────── */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Hardware</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                Install an Ethernet/Wi-Fi I/O module with 16–26 I/O lines (recommended: <strong>KinCony KC868-A16</strong> —
                ESP32, 16 opto-isolated digital inputs + 16 outputs + RS485; alternatives: Advantech ADAM-6050, Waveshare Modbus POE ETH Relay).
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Lifts:</strong> wire the lift controller's volt-free (dry) fault contacts — general fault, out-of-service, door fault, passenger alarm — to digital inputs.</li>
                <li><strong>Electrical boards:</strong> wire a 3-phase voltage monitoring (phase-failure) relay's dry contact to a digital input; optionally connect an RS485 Modbus energy meter (e.g. Eastron SDM630) for real voltage readings.</li>
                <li>Debounce contacts in firmware (~500 ms) and transmit on state <em>change</em>, not level.</li>
              </ul>
              <p className="text-xs text-slate-500">Full survey and wiring diagram: <code className="rounded bg-slate-100 px-1">docs/IOT_INTEGRATION_RESEARCH.md</code></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. Register the device & get its token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                Add the device in the <strong>Devices</strong> tab. The API token is shown <strong>once</strong> on creation —
                copy it into the firmware. Use <em>Regenerate token</em> (key icon) if it is ever lost or leaked.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">3. Firmware → API contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-slate-500">Event ingestion endpoint</Label>
                <CopyField value={`POST ${API_BASE}/iot/ingest`} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-slate-500">Heartbeat endpoint (call every ~60s)</Label>
                <CopyField value={`POST ${API_BASE}/iot/heartbeat`} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-slate-500">Auth header (both endpoints)</Label>
                <CopyField value="X-Device-Token: <your-device-token>" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-slate-500">Sample request</Label>
                <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">{sampleCurl}</pre>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                <li><code>event_type</code>: fault | voltage_fluctuation | status_change | heartbeat | test</li>
                <li><code>severity</code>: info | warning | critical — <strong>warning/critical</strong> trigger an email to the association secretary and an internal panel alert for all admins.</li>
                <li>Repeated identical alerts (same device + type + I/O line) within the cooldown window (default 15 min) are stored but do not re-notify.</li>
                <li>A device silent for longer than the offline threshold (default 10 min) is counted as offline on this page.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">4. Alert routing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              <p>
                On <strong>warning</strong>/<strong>critical</strong> events the server (a) creates a notification for every admin in the
                Notification Center, and (b) emails <code className="rounded bg-slate-100 px-1">SECRETARY_ALERT_EMAIL</code> (configured in
                the backend <code className="rounded bg-slate-100 px-1">.env</code>; delivery is fail-soft and logged to
                <code className="rounded bg-slate-100 px-1">storage/logs/mail.log</code>). Acknowledge handled alerts in the Events tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit dialog */}
      <DeviceFormDialog
        open={formOpen}
        initial={editDevice}
        onClose={() => { setFormOpen(false); setEditDevice(null); }}
        onCreated={(device) => {
          if (device.apiToken) setShownToken({ token: device.apiToken, deviceName: device.name });
          void loadSummary();
        }}
      />

      {/* Token shown-once dialog */}
      <TokenDialog
        token={shownToken?.token ?? null}
        deviceName={shownToken?.deviceName ?? ''}
        onClose={() => setShownToken(null)}
      />

      {/* Regenerate confirm */}
      {regenConfirm && (
        <Dialog open onOpenChange={() => setRegenConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Regenerate Token</DialogTitle></DialogHeader>
            <p className="py-2 text-sm text-slate-600">
              Regenerate the token for <strong>{regenConfirm.name}</strong>? The current token stops working immediately —
              the device firmware must be updated with the new one.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegenConfirm(null)}>Cancel</Button>
              <Button onClick={() => handleRegenerate(regenConfirm)}>Regenerate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Device</DialogTitle></DialogHeader>
            <p className="py-2 text-sm text-slate-600">
              Delete <strong>{deleteConfirm.name}</strong>? Its token stops working and it disappears from monitoring.
              Past events are kept.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
