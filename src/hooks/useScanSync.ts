
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Hook that listens for storage events dispatched by scan pages
 * and triggers a re-render so the admin dashboard reflects new data.
 * Since Zustand store is in-memory (same tab), cross-tab sync uses
 * a BroadcastChannel as well for real multi-device scenarios.
 */
export function useScanSync() {
  const store = useAppStore();
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // BroadcastChannel for cross-tab real-time sync
    try {
      channelRef.current = new BroadcastChannel('apartmentos-scan-sync');
      channelRef.current.onmessage = (event) => {
        if (event.data?.type === 'visitor-entry' && event.data.payload) {
          store.addVisitor(event.data.payload);
        }
        if (event.data?.type === 'visitor-checkout') {
          store.checkOutVisitor(event.data.payload);
        }
        if (event.data?.type === 'vehicle-entry' && event.data.payload) {
          store.addVehicle(event.data.payload);
        }
        if (event.data?.type === 'vehicle-checkout') {
          store.checkOutVehicle(event.data.payload);
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      channelRef.current?.close();
    };
  }, []);

  return channelRef.current;
}

/** Broadcast a scan event to all open admin tabs */
export function broadcastScanEvent(type: string, payload: unknown) {
  try {
    const channel = new BroadcastChannel('apartmentos-scan-sync');
    channel.postMessage({ type, payload });
    channel.close();
  } catch {
    // ignore
  }
}
