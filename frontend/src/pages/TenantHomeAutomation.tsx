import { useEffect, useState } from 'react';
import {
  Home, Lightbulb, ToggleLeft, Gauge, PlugZap, RefreshCw, Wifi, WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHomeAutomationStore } from '@/stores/useHomeAutomationStore';
import type { HomeAutomationHub, HomeAutomationDevice } from '@/types';
import { useToast } from '@/hooks/use-toast';

const COMMANDABLE = new Set(['light', 'switch', 'climate', 'cover', 'lock']);

function domainIcon(domain: string) {
  switch (domain) {
    case 'light': return <Lightbulb className="h-5 w-5" />;
    case 'switch': return <ToggleLeft className="h-5 w-5" />;
    case 'sensor':
    case 'binary_sensor': return <Gauge className="h-5 w-5" />;
    default: return <PlugZap className="h-5 w-5" />;
  }
}

function isOn(state?: string | null) {
  return state === 'on' || state === 'open' || state === 'unlocked' || state === 'heat' || state === 'cool';
}

export default function TenantHomeAutomation() {
  const { hubs, devices, loading, devicesLoading, loadMyHubs, loadMyDevices, myCommand } = useHomeAutomationStore();
  const { toast } = useToast();
  const [selectedHub, setSelectedHub] = useState<HomeAutomationHub | null>(null);
  const [busyEntity, setBusyEntity] = useState<string | null>(null);

  useEffect(() => { loadMyHubs(); }, [loadMyHubs]);

  useEffect(() => {
    if (!selectedHub && hubs.length > 0) {
      setSelectedHub(hubs[0]);
      loadMyDevices(hubs[0].id);
    }
  }, [hubs, selectedHub, loadMyDevices]);

  const selectHub = (hub: HomeAutomationHub) => { setSelectedHub(hub); loadMyDevices(hub.id); };

  const control = async (device: HomeAutomationDevice, service: string) => {
    if (!selectedHub) return;
    setBusyEntity(device.entityId);
    try {
      await myCommand(selectedHub.id, device.entityId, service);
      toast({ title: 'Done', description: `${device.friendlyName ?? device.entityId} → ${service}` });
    } catch (e) {
      toast({ title: 'Command failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    } finally {
      setBusyEntity(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Home className="h-6 w-6" /> My Home</h1>
        <p className="text-sm text-muted-foreground">View and control your connected smart-home devices.</p>
      </div>

      {loading && hubs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : hubs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          No smart-home hub is linked to your account yet. Contact the office to connect your Home Assistant hub.
        </CardContent></Card>
      ) : (
        <>
          {hubs.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {hubs.map((h) => (
                <Button key={h.id} variant={selectedHub?.id === h.id ? 'default' : 'outline'} size="sm" onClick={() => selectHub(h)}>
                  {h.name}
                </Button>
              ))}
            </div>
          )}

          {selectedHub && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {selectedHub.name}
                    {selectedHub.lastCheckOk === 1
                      ? <Badge variant="default" className="gap-1"><Wifi className="h-3 w-3" /> online</Badge>
                      : selectedHub.lastCheckOk === 0
                        ? <Badge variant="destructive" className="gap-1"><WifiOff className="h-3 w-3" /> offline</Badge>
                        : null}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => selectHub(selectedHub)}><RefreshCw className="h-4 w-4" /></Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devicesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading devices…</p>
                ) : devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No devices are shared with you yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {devices.map((d) => {
                      const commandable = COMMANDABLE.has(d.domain) && d.isControllable === 1;
                      const on = isOn(d.state);
                      return (
                        <div key={d.id} className={`rounded-xl border p-4 transition ${on ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={on ? 'text-amber-500' : 'text-muted-foreground'}>{domainIcon(d.domain)}</span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{d.friendlyName ?? d.entityId}</div>
                              <div className="text-xs text-muted-foreground">
                                {d.reachable ? <>{d.state ?? '—'}{d.unit ? ` ${d.unit}` : ''}</> : <span className="text-red-500">offline</span>}
                              </div>
                            </div>
                          </div>
                          {commandable && (
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" className="flex-1" variant={on ? 'default' : 'outline'} disabled={busyEntity === d.entityId} onClick={() => control(d, 'turn_on')}>On</Button>
                              <Button size="sm" className="flex-1" variant={!on ? 'default' : 'outline'} disabled={busyEntity === d.entityId} onClick={() => control(d, 'turn_off')}>Off</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
