import { useEffect, useState, useCallback } from 'react';
import { Camera, Plus, RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, Eye, Edit, Trash2, Zap, Image } from 'lucide-react';
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
import CameraLiveView from '@/components/features/CameraLiveView';
import { useCameraStore } from '@/stores/useCameraStore';
import type { CameraDevice, CameraEvent, CameraSnapshot } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ZONES = ['Entrance', 'Parking', 'Lobby', 'Corridor', 'Perimeter', 'Stairwell', 'Rooftop', 'Other'];
const STATUSES = ['Online', 'Offline', 'Maintenance', 'Fault'];
const EVENT_TYPES = ['Motion', 'Unknown Person', 'Vehicle', 'Intrusion', 'Tamper', 'Offline', 'Online', 'Manual'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

function formatTime(ts?: string) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString();
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Online: 'bg-green-500',
    Offline: 'bg-red-500',
    Maintenance: 'bg-amber-500',
    Fault: 'bg-orange-500',
  };
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status] ?? 'bg-slate-400'}`} />
  );
}

// ── Camera Form Dialog ────────────────────────────────────────────────────────

interface CameraFormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: CameraDevice | null;
  onSaved: () => void;
}

function CameraFormDialog({ open, onClose, initial, onSaved }: CameraFormDialogProps) {
  const { createCamera, updateCamera } = useCameraStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', location: '', zone: '', ipAddress: '', rtspUrl: '', hlsUrl: '',
    manufacturer: '', model: '', resolution: '', notes: '',
    status: 'Offline' as CameraDevice['status'],
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        location: initial?.location ?? '',
        zone: initial?.zone ?? '',
        ipAddress: initial?.ipAddress ?? '',
        rtspUrl: initial?.rtspUrl ?? '',
        hlsUrl: initial?.hlsUrl ?? '',
        manufacturer: initial?.manufacturer ?? '',
        model: initial?.model ?? '',
        resolution: initial?.resolution ?? '',
        notes: initial?.notes ?? '',
        status: initial?.status ?? 'Offline',
      });
    }
  }, [open, initial]);

  function f(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      toast({ title: 'Validation', description: 'Name and location are required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (initial) {
        await updateCamera(initial.id, form);
        toast({ title: 'Camera updated' });
      } else {
        await createCamera(form);
        toast({ title: 'Camera created' });
      }
      onSaved();
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to save camera.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Camera' : 'Add Camera'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={f('name')} placeholder="e.g. Entrance Cam 1" required />
            </div>
            <div className="space-y-1">
              <Label>Location *</Label>
              <Input value={form.location} onChange={f('location')} placeholder="e.g. Main Gate" required />
            </div>
            <div className="space-y-1">
              <Label>Zone</Label>
              <Select value={form.zone} onValueChange={(v) => setForm((p) => ({ ...p, zone: v }))}>
                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>
                  {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as CameraDevice['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>IP Address</Label>
              <Input value={form.ipAddress} onChange={f('ipAddress')} placeholder="192.168.1.100" />
            </div>
            <div className="space-y-1">
              <Label>RTSP URL</Label>
              <Input value={form.rtspUrl} onChange={f('rtspUrl')} placeholder="rtsp://... (source stream)" />
            </div>
            <div className="space-y-1">
              <Label>Live Stream URL (HLS / MJPEG)</Label>
              <Input value={form.hlsUrl} onChange={f('hlsUrl')} placeholder="https://nvr.example/stream.m3u8" />
              <p className="text-[11px] text-slate-500">Browser-playable stream (HLS .m3u8 or MJPEG). RTSP cannot play in a browser — convert it via your NVR / go2rtc / MediaMTX.</p>
            </div>
            <div className="space-y-1">
              <Label>Manufacturer</Label>
              <Input value={form.manufacturer} onChange={f('manufacturer')} placeholder="e.g. Hikvision" />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input value={form.model} onChange={f('model')} placeholder="e.g. DS-2CD2143G2" />
            </div>
            <div className="space-y-1">
              <Label>Resolution</Label>
              <Input value={form.resolution} onChange={f('resolution')} placeholder="e.g. 1080p" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={f('notes')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : (initial ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Event Mini-form ───────────────────────────────────────────────────────

interface LogEventDialogProps {
  open: boolean;
  cameraId: string;
  onClose: () => void;
}

function LogEventDialog({ open, cameraId, onClose }: LogEventDialogProps) {
  const { logEvent } = useCameraStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ eventType: 'Manual', severity: 'Low', description: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await logEvent(cameraId, { eventType: form.eventType, severity: form.severity, description: form.description });
      toast({ title: 'Event logged' });
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to log event.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Manual Event</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Event Type</Label>
            <Select value={form.eventType} onValueChange={(v) => setForm((p) => ({ ...p, eventType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Severity</Label>
            <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Logging…' : 'Log Event'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Camera Detail Dialog ──────────────────────────────────────────────────────

interface CameraDetailDialogProps {
  open: boolean;
  camera: CameraDevice | null;
  onClose: () => void;
}

function CameraDetailDialog({ open, camera, onClose }: CameraDetailDialogProps) {
  const { createSnapshot, loadEvents, events } = useCameraStore();
  const { toast } = useToast();
  const [logEventOpen, setLogEventOpen] = useState(false);
  const [snapLoading, setSnapLoading] = useState(false);

  useEffect(() => {
    if (open && camera) {
      loadEvents(camera.id);
    }
  }, [open, camera, loadEvents]);

  async function handleSnapshot() {
    if (!camera) return;
    setSnapLoading(true);
    try {
      await createSnapshot(camera.id);
      toast({ title: 'Snapshot created' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create snapshot.', variant: 'destructive' });
    } finally {
      setSnapLoading(false);
    }
  }

  if (!camera) return null;

  const recentEvents = events.slice(0, 5);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StatusDot status={camera.status} />
              {camera.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Camera info */}
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div><span className="text-slate-500">Location: </span>{camera.location}</div>
              <div><span className="text-slate-500">Zone: </span>{camera.zone ?? '—'}</div>
              <div><span className="text-slate-500">IP: </span>{camera.ipAddress ?? '—'}</div>
              <div><span className="text-slate-500">Resolution: </span>{camera.resolution ?? '—'}</div>
              <div><span className="text-slate-500">Manufacturer: </span>{camera.manufacturer ?? '—'}</div>
              <div><span className="text-slate-500">Model: </span>{camera.model ?? '—'}</div>
              <div><span className="text-slate-500">Status: </span><StatusBadge status={camera.status} size="sm" /></div>
              <div><span className="text-slate-500">Last Ping: </span>{camera.lastHeartbeat ? formatTime(camera.lastHeartbeat) : '—'}</div>
            </div>

            {/* Live view (falls back to the latest snapshot when no stream is set) */}
            <CameraLiveView hlsUrl={camera.hlsUrl} snapshotUrl={camera.snapshotUrl} />

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setLogEventOpen(true)}>
                <Zap className="mr-1 h-3 w-3" />Log Manual Event
              </Button>
              <Button size="sm" variant="outline" onClick={handleSnapshot} disabled={snapLoading}>
                <Image className="mr-1 h-3 w-3" />{snapLoading ? 'Creating…' : 'Create Snapshot'}
              </Button>
            </div>

            {/* Recent events */}
            {recentEvents.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Last 5 Events</p>
                <div className="space-y-1.5">
                  {recentEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs">
                      <StatusBadge status={ev.severity} size="sm" />
                      <span className="font-medium">{ev.eventType}</span>
                      {ev.description && <span className="flex-1 truncate text-slate-500">{ev.description}</span>}
                      <span className="ml-auto text-slate-400">{formatTime(ev.occurredAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI detection callout */}
            <div className="rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">AI Detection Ready</span> — Motion analysis, unknown person detection, and vehicle recognition will be enabled in a future release via the RTSP stream integration.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LogEventDialog open={logEventOpen} cameraId={camera.id} onClose={() => setLogEventOpen(false)} />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CameraManagement() {
  const {
    cameras, dashboard, events, snapshots, timeline, loading,
    loadCameras, loadDashboard, loadEvents, loadSnapshots, loadTimeline,
    sendHeartbeat, removeCamera, acknowledgeEvent,
  } = useCameraStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [formOpen, setFormOpen] = useState(false);
  const [editCamera, setEditCamera] = useState<CameraDevice | null>(null);
  const [detailCamera, setDetailCamera] = useState<CameraDevice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CameraDevice | null>(null);
  const [timelineCameraId, setTimelineCameraId] = useState('');
  const [eventsFilter, setEventsFilter] = useState({ cameraId: '', eventType: '', severity: '' });

  const refresh = useCallback(() => {
    void loadCameras();
    void loadDashboard();
  }, [loadCameras, loadDashboard]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (activeTab === 'events') {
      void loadEvents('', eventsFilter.eventType || eventsFilter.severity
        ? { event_type: eventsFilter.eventType || undefined, severity: eventsFilter.severity || undefined }
        : undefined);
    }
  }, [activeTab, eventsFilter, loadEvents]);

  useEffect(() => {
    if (timelineCameraId) {
      void loadTimeline(timelineCameraId);
    }
  }, [timelineCameraId, loadTimeline]);

  async function handleHeartbeat(camera: CameraDevice) {
    try {
      await sendHeartbeat(camera.id);
      toast({ title: `${camera.name} pinged`, description: 'Status set to Online.' });
    } catch {
      toast({ title: 'Ping failed', variant: 'destructive' });
    }
  }

  async function handleDelete(camera: CameraDevice) {
    try {
      await removeCamera(camera.id);
      toast({ title: 'Camera deleted' });
      setDeleteConfirm(null);
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  }

  async function handleAcknowledge(eventId: string) {
    try {
      await acknowledgeEvent(eventId);
      toast({ title: 'Event acknowledged' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  }

  // ── Columns ─────────────────────────────────────────────────────────────────

  const cameraColumns: Column<CameraDevice>[] = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'zone', label: 'Zone', render: (c) => c.zone ?? '—' },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'lastHeartbeat', label: 'Last Heartbeat', render: (c) => <span className="text-xs">{formatTime(c.lastHeartbeat)}</span> },
  ];

  const eventColumns: Column<CameraEvent>[] = [
    { key: 'cameraId', label: 'Camera', render: (e) => {
      const cam = cameras.find((c) => c.id === e.cameraId);
      return <span className="text-xs">{cam?.name ?? `#${e.cameraId}`}</span>;
    }},
    { key: 'eventType', label: 'Event Type', render: (e) => <span className="font-medium">{e.eventType}</span> },
    { key: 'severity', label: 'Severity', render: (e) => <StatusBadge status={e.severity} /> },
    { key: 'occurredAt', label: 'Time', render: (e) => <span className="text-xs">{formatTime(e.occurredAt)}</span> },
    { key: 'acknowledged', label: 'Status', render: (e) => (
      e.acknowledged
        ? <Badge variant="secondary" className="text-xs">Acknowledged</Badge>
        : <Badge variant="outline" className="text-xs text-amber-600">Pending</Badge>
    )},
  ];

  // ── KPI values ──────────────────────────────────────────────────────────────

  const onlineCount = dashboard?.byStatus?.Online ?? 0;
  const offlineCount = dashboard?.byStatus?.Offline ?? 0;
  const maintenanceCount = (dashboard?.byStatus?.Maintenance ?? 0) + (dashboard?.byStatus?.Fault ?? 0);
  const unackCount = dashboard?.unacknowledgedEvents ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">CCTV Management</h1>
            <p className="text-sm text-slate-500">Monitor and manage camera devices</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditCamera(null); setFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />Add Camera
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* ── Tab: Dashboard ──────────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Cameras</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard?.totalCameras ?? cameras.length}</p>
                  </div>
                  <Camera className="h-8 w-8 text-slate-300" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Online</p>
                    <p className="mt-1 text-2xl font-bold text-green-600">{onlineCount}</p>
                  </div>
                  <Wifi className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Offline</p>
                    <p className="mt-1 text-2xl font-bold text-red-600">{offlineCount}</p>
                  </div>
                  <WifiOff className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unacknowledged</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">{unackCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Camera status grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Camera Status Grid</CardTitle>
            </CardHeader>
            <CardContent>
              {cameras.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No cameras registered yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {cameras.map((camera) => (
                    <div key={camera.id} className="flex flex-col gap-1.5 rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={camera.status} />
                        <span className="flex-1 truncate text-sm font-medium">{camera.name}</span>
                      </div>
                      <p className="text-xs text-slate-500">{camera.zone ?? camera.location}</p>
                      <p className="text-xs text-slate-400">{camera.lastHeartbeat ? formatTime(camera.lastHeartbeat) : 'Never pinged'}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 text-xs"
                        onClick={() => handleHeartbeat(camera)}
                      >
                        <Zap className="mr-1 h-3 w-3" />Ping
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {(dashboard?.recentEvents?.length ?? 0) === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No recent events.</p>
              ) : (
                <div className="overflow-hidden rounded-md border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Camera</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Event</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Severity</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dashboard?.recentEvents?.map((ev) => {
                        const cam = cameras.find((c) => c.id === ev.cameraId);
                        return (
                          <tr key={ev.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-xs">{cam?.name ?? `#${ev.cameraId}`}</td>
                            <td className="px-3 py-2 font-medium">{ev.eventType}</td>
                            <td className="px-3 py-2"><StatusBadge status={ev.severity} size="sm" /></td>
                            <td className="px-3 py-2 text-xs text-slate-400">{formatTime(ev.occurredAt)}</td>
                            <td className="px-3 py-2">
                              {!ev.acknowledged && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleAcknowledge(ev.id)}>
                                  <CheckCircle className="mr-1 h-3 w-3" />Ack
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Detection callout */}
          <div className="rounded-lg bg-slate-100 px-5 py-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">AI Detection Ready</span> — Motion analysis, unknown person detection, and vehicle recognition will be enabled in a future release via the RTSP stream integration.
          </div>
        </TabsContent>

        {/* ── Tab: Cameras ─────────────────────────────────────────────────── */}
        <TabsContent value="cameras">
          <Card>
            <CardContent className="pt-4">
              <DataTable
                data={cameras}
                columns={cameraColumns}
                searchKeys={['name', 'location', 'zone'] as (keyof CameraDevice)[]}
                searchPlaceholder="Search cameras..."
                actions={(camera) => (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => { setDetailCamera(camera); setDetailOpen(true); }}
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => handleHeartbeat(camera)}
                      title="Ping camera"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => { setEditCamera(camera); setFormOpen(true); }}
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5 text-indigo-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => setDeleteConfirm(camera)}
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

        {/* ── Tab: Events ──────────────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-4">
              <Select value={eventsFilter.cameraId || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, cameraId: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All cameras" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cameras</SelectItem>
                  {cameras.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventsFilter.eventType || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, eventType: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All event types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All event types</SelectItem>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={eventsFilter.severity || 'all'} onValueChange={(v) => setEventsFilter((p) => ({ ...p, severity: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All severities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <DataTable
                data={events}
                columns={eventColumns}
                pageSize={15}
                actions={(ev) => (
                  !ev.acknowledged ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAcknowledge(ev.id)}>
                      <CheckCircle className="mr-1 h-3 w-3" />Acknowledge
                    </Button>
                  ) : null
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Timeline ─────────────────────────────────────────────────── */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Select Camera</Label>
                <Select value={timelineCameraId || 'none'} onValueChange={(v) => setTimelineCameraId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Choose a camera…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Choose a camera…</SelectItem>
                    {cameras.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {timelineCameraId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Timeline — {cameras.find((c) => c.id === timelineCameraId)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
                ) : timeline.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No timeline entries.</p>
                ) : (
                  <ol className="relative space-y-3 border-l border-slate-200 pl-4">
                    {timeline.map((item, idx) => {
                      const isEvent = (item as Record<string, unknown>)._type === 'event';
                      const isSnapshot = (item as Record<string, unknown>)._type === 'snapshot';
                      const time = (item as Record<string, unknown>)._time as string | undefined;

                      if (isEvent) {
                        const ev = item as CameraEvent & { _type: string; _time: string };
                        return (
                          <li key={`ev-${ev.id ?? idx}`} className="ml-2">
                            <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white" />
                            <div className="flex items-center gap-2">
                              <StatusBadge status={ev.severity} size="sm" />
                              <span className="font-medium text-sm">{ev.eventType}</span>
                              {ev.description && <span className="text-xs text-slate-500">{ev.description}</span>}
                              <span className="ml-auto text-xs text-slate-400">{formatTime(time ?? ev.occurredAt)}</span>
                            </div>
                          </li>
                        );
                      }

                      if (isSnapshot) {
                        const snap = item as CameraSnapshot & { _type: string; _time: string };
                        return (
                          <li key={`snap-${snap.id ?? idx}`} className="ml-2">
                            <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 ring-2 ring-white" />
                            <div className="flex items-center gap-3">
                              {/* Snapshot thumbnail placeholder */}
                              <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center rounded bg-slate-100">
                                {snap.fileUrl ? (
                                  <img src={snap.fileUrl} alt="Snapshot" className="h-full w-full rounded object-cover" />
                                ) : (
                                  <Camera className="h-5 w-5 text-slate-300" />
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-medium">Snapshot</span>
                                <p className="text-xs text-slate-500">Trigger: {snap.trigger}</p>
                                {snap.notes && <p className="text-xs text-slate-400">{snap.notes}</p>}
                              </div>
                              <span className="ml-auto text-xs text-slate-400">{formatTime(time ?? snap.capturedAt)}</span>
                            </div>
                          </li>
                        );
                      }

                      return null;
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Camera form dialog */}
      <CameraFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCamera(null); }}
        initial={editCamera}
        onSaved={refresh}
      />

      {/* Camera detail dialog */}
      <CameraDetailDialog
        open={detailOpen}
        camera={detailCamera}
        onClose={() => { setDetailOpen(false); setDetailCamera(null); }}
      />

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Camera</DialogTitle>
            </DialogHeader>
            <p className="py-2 text-sm text-slate-600">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
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
