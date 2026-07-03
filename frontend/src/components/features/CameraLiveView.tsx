import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { VideoOff, Loader2 } from 'lucide-react';

interface CameraLiveViewProps {
  /** Browser-playable stream: HLS (.m3u8) or MJPEG endpoint. */
  hlsUrl?: string;
  /** Snapshot to show as a poster / fallback when no live stream is configured. */
  snapshotUrl?: string;
  className?: string;
}

function isMjpeg(url: string) {
  return /mjpe?g/i.test(url) || /\.cgi(\?|$)/i.test(url);
}

/**
 * Live camera view. Plays an HLS stream via the bundled hls.js (falling back to
 * native HLS on Safari/iOS), or renders an MJPEG endpoint through <img>. RTSP is
 * intentionally not accepted here because browsers cannot play it — the admin
 * supplies a browser-playable hls_url produced from the RTSP source by an
 * NVR / go2rtc / MediaMTX.
 */
export default function CameraLiveView({ hlsUrl, snapshotUrl, className }: CameraLiveViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');

  useEffect(() => {
    if (!hlsUrl || isMjpeg(hlsUrl)) return;
    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');
    let hls: Hls | null = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS play HLS natively.
      video.src = hlsUrl;
      const onPlay = () => setStatus('playing');
      const onErr = () => setStatus('error');
      video.addEventListener('loadeddata', onPlay);
      video.addEventListener('error', onErr);
      return () => {
        video.removeEventListener('loadeddata', onPlay);
        video.removeEventListener('error', onErr);
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({ liveDurationInfinity: true, lowLatencyMode: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { void video.play(); setStatus('playing'); });
      hls.on(Hls.Events.ERROR, (_evt, data) => { if (data.fatal) setStatus('error'); });
    } else {
      setStatus('error');
    }

    return () => { hls?.destroy(); };
  }, [hlsUrl]);

  const boxClass = `relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-black ${className ?? ''}`;

  // No live stream configured — show snapshot or an empty state.
  if (!hlsUrl) {
    return (
      <div className={boxClass}>
        {snapshotUrl
          ? <img src={snapshotUrl} alt="Latest snapshot" className="h-full w-full object-contain" />
          : <div className="flex flex-col items-center gap-2 text-slate-400"><VideoOff className="h-8 w-8" /><span className="text-xs">No live stream configured</span></div>}
      </div>
    );
  }

  // MJPEG endpoints stream natively through <img>.
  if (isMjpeg(hlsUrl)) {
    return (
      <div className={boxClass}>
        <img src={hlsUrl} alt="Live view" className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className={boxClass}>
      <video ref={videoRef} className="h-full w-full object-contain" muted autoPlay playsInline controls poster={snapshotUrl} />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-slate-300">
          <VideoOff className="h-8 w-8" />
          <span className="text-xs">Stream unavailable — check the HLS URL and that the hub is reachable</span>
        </div>
      )}
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
      </span>
    </div>
  );
}
